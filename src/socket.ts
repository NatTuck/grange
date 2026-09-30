import { type Channel, Socket } from "phoenix";
import type { Farm, FarmAction, FarmSummary, Player } from "../shared/types";
import { useGameStore } from "./store";

/** Single shared connection for the whole SPA. */
export const socket = new Socket("/socket", { params: {} });

export interface Ack {
	ok: boolean;
	error?: string;
}

export interface LoginAck extends Ack {
	player?: Player;
	farm?: Farm;
}

export interface FarmAck extends Ack {
	farm?: Farm;
	removed?: boolean;
}

/** The lobby channel is shared by the whole app; the farm channel tracks visits. */
let lobbyPromise: Promise<Channel> | null = null;
let farmChannel: Channel | null = null;
let farmOwner: string | null = null;
let currentUsername = "";
let connected = false;

function reasonOf(payload: unknown): string | undefined {
	if (payload && typeof payload === "object") {
		if ("error" in payload)
			return String((payload as { error?: unknown }).error);
		if ("reason" in payload)
			return String((payload as { reason?: unknown }).reason);
	}
	return undefined;
}

function joinLobby(): Promise<Channel> {
	if (lobbyPromise) return lobbyPromise;

	const channel = socket.channel("lobby", {});

	channel.on("players", (payload: unknown) => {
		const { players } = payload as { players: Player[] };
		useGameStore.getState().setPlayers(players);
	});

	channel.on("farms", (payload: unknown) => {
		const { farms } = payload as { farms: FarmSummary[] };
		useGameStore.getState().setFarms(farms);
	});

	lobbyPromise = new Promise<Channel>((resolve, reject) => {
		channel
			.join()
			.receive("ok", () => resolve(channel))
			.receive("error", (payload: unknown) => {
				lobbyPromise = null;
				reject(new Error(reasonOf(payload) ?? "could not join lobby"));
			})
			.receive("timeout", () => {
				lobbyPromise = null;
				reject(new Error("lobby timed out"));
			});
	});

	return lobbyPromise;
}

export function emitLogin(
	username: string,
	cb?: (res: LoginAck) => void,
): void {
	currentUsername = username;

	joinLobby()
		.then((channel) =>
			channel
				.push("login", { username })
				.receive("ok", (payload: unknown) => {
					const { player, farm } = payload as { player: Player; farm: Farm };
					cb?.({ ok: true, player, farm });
				})
				.receive("error", (payload: unknown) =>
					cb?.({ ok: false, error: reasonOf(payload) ?? "Login failed" }),
				)
				.receive("timeout", () =>
					cb?.({ ok: false, error: "Login timed out" }),
				),
		)
		.catch((err: Error) => cb?.({ ok: false, error: err.message }));
}

export function requestFarms(): void {
	joinLobby()
		.then((channel) =>
			channel.push("farms", {}).receive("ok", (payload: unknown) => {
				const { farms } = payload as { farms: FarmSummary[] };
				useGameStore.getState().setFarms(farms);
			}),
		)
		.catch(() => {});
}

export function emitVisitFarm(
	owner: string,
	cb?: (res: FarmAck) => void,
): void {
	// Already visiting this farm: nothing to do.
	if (farmChannel && farmOwner === owner) {
		cb?.({ ok: true });
		return;
	}

	const channel = socket.channel(`farm:${owner}`, {
		username: currentUsername,
	});

	channel.on("farmUpdate", (payload: unknown) => {
		const { farm } = payload as { farm: Farm };
		useGameStore.getState().setActiveFarm(farm);
	});

	channel
		.join()
		.receive("ok", (payload: unknown) => {
			const { farm } = payload as { farm: Farm };
			const previous = farmChannel;
			farmChannel = channel;
			farmOwner = owner;
			useGameStore.getState().setActiveFarm(farm);
			// Leaving the old channel removes us from the old farm's visitors.
			if (previous && previous !== channel) previous.leave();
			cb?.({ ok: true, farm });
		})
		.receive("error", (payload: unknown) =>
			cb?.({ ok: false, error: reasonOf(payload) ?? "Farm not found" }),
		)
		.receive("timeout", () => cb?.({ ok: false, error: "Farm timed out" }));
}

export function emitLeaveFarm(cb?: (res: FarmAck) => void): void {
	const channel = farmChannel;
	if (!channel) {
		cb?.({ ok: true, removed: false });
		return;
	}

	channel
		.push("leaveFarm", {})
		.receive("ok", (payload: unknown) => {
			const { removed } = payload as { removed: boolean };
			channel.leave();
			farmChannel = null;
			farmOwner = null;
			useGameStore.getState().setActiveFarm(null);
			cb?.({ ok: true, removed });
		})
		.receive("error", (payload: unknown) =>
			cb?.({ ok: false, error: reasonOf(payload) ?? "Could not leave farm" }),
		);
}

export function emitFarmAction(
	owner: string,
	action: FarmAction,
	cb?: (res: FarmAck) => void,
): void {
	const channel = farmChannel;
	if (!channel || farmOwner !== owner) {
		cb?.({ ok: false, error: "not visiting farm" });
		return;
	}

	channel
		.push("farmAction", { owner, action })
		.receive("ok", () => cb?.({ ok: true }))
		.receive("error", (payload: unknown) =>
			cb?.({ ok: false, error: reasonOf(payload) ?? "Invalid action" }),
		);
}

/** Registers global handlers and restores a saved session, if any. */
export function initSocket(): void {
	socket.connect();

	socket.onOpen(() => {
		const reconnecting = connected;
		connected = true;
		joinLobby().catch(() => {});
		if (reconnecting && currentUsername) emitLogin(currentUsername);
	});

	const saved = localStorage.getItem("grange.username");
	if (saved) {
		currentUsername = saved;
		emitLogin(saved);
	} else {
		joinLobby().catch(() => {});
	}
}
