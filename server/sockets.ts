import type { Server as SocketServer } from "socket.io";
import type { Farm, FarmAction, ServerState } from "../shared/types";
import { applyFarmAction } from "./farm";
import {
	farmByOwner,
	getOrCreateFarm,
	leaveFarm,
	summarizeFarms,
	visitFarm,
} from "./farms";
import { getOrCreatePlayer } from "./players";

interface SocketData {
	username?: string;
	/** Owner of the farm this socket is currently viewing, if any. */
	farmOwner?: string;
}

const room = (owner: string): string => `farm:${owner}`;

export function registerSocketHandlers(
	io: SocketServer,
	state: ServerState,
): void {
	function broadcastPlayers(): void {
		io.emit("players", { players: state.players });
	}

	function broadcastFarms(): void {
		io.emit("farms", { farms: summarizeFarms(state) });
	}

	function broadcastFarm(farm: Farm): void {
		io.to(room(farm.owner)).emit("farmUpdate", { farm });
	}

	function loggedInName(socket: { data: SocketData }): string | null {
		return socket.data.username ?? null;
	}

	io.on("connection", (socket) => {
		const data = socket.data as SocketData;

		socket.on("login", (payload: unknown, cb?: (res: unknown) => void) => {
			const name = String(
				(payload as { username?: unknown } | undefined)?.username ?? "",
			).trim();
			if (!name) {
				cb?.({ ok: false, error: "username is required" });
				return;
			}

			const player = getOrCreatePlayer(state, name);
			const farm = getOrCreateFarm(state, name);
			data.username = name;

			cb?.({ ok: true, player, farm });
			broadcastPlayers();
			broadcastFarms();
		});

		socket.on("farms", (cb?: (res: unknown) => void) => {
			cb?.({ farms: summarizeFarms(state) });
		});

		socket.on("visitFarm", (payload: unknown, cb?: (res: unknown) => void) => {
			const name = loggedInName(socket);
			if (!name) {
				cb?.({ ok: false, error: "not logged in" });
				return;
			}
			const owner = String((payload as { owner?: unknown })?.owner ?? "");
			const res = visitFarm(state, owner, name);
			if ("error" in res) {
				cb?.({ ok: false, error: res.error });
				return;
			}
			if (data.farmOwner && data.farmOwner !== owner) {
				socket.leave(room(data.farmOwner));
			}
			data.farmOwner = owner;
			socket.join(room(owner));
			cb?.({ ok: true, farm: res.farm });
			broadcastFarms();
			broadcastFarm(res.farm);
		});

		socket.on("leaveFarm", (cb?: (res: unknown) => void) => {
			const name = loggedInName(socket);
			if (!name) {
				cb?.({ ok: false, error: "not logged in" });
				return;
			}
			const owner = data.farmOwner;
			if (!owner) {
				cb?.({ ok: true, removed: false });
				return;
			}
			const farm = leaveFarm(state, owner, name);
			socket.leave(room(owner));
			data.farmOwner = undefined;
			cb?.({ ok: true, removed: true });
			broadcastFarms();
			if (farm) broadcastFarm(farm);
		});

		socket.on("farmAction", (payload: unknown, cb?: (res: unknown) => void) => {
			const name = loggedInName(socket);
			if (!name) {
				cb?.({ ok: false, error: "not logged in" });
				return;
			}
			const owner = String((payload as { owner?: unknown })?.owner ?? "");
			const action = (payload as { action?: FarmAction })?.action;
			if (!action) {
				cb?.({ ok: false, error: "missing action" });
				return;
			}
			if (owner !== name) {
				cb?.({ ok: false, error: "not your farm" });
				return;
			}
			const farm = farmByOwner(state, owner);
			if (!farm) {
				cb?.({ ok: false, error: "farm not found" });
				return;
			}
			const result = applyFarmAction(farm, action);
			if (!result.ok) {
				cb?.({ ok: false, error: result.error });
				return;
			}
			cb?.({ ok: true });
			broadcastFarms();
			broadcastFarm(farm);
		});

		socket.on("disconnect", () => {
			const name = data.username;
			if (name && data.farmOwner) {
				const owner = data.farmOwner;
				leaveFarm(state, owner, name);
				broadcastFarms();
				const farm = farmByOwner(state, owner);
				if (farm) broadcastFarm(farm);
			}
			data.username = undefined;
			data.farmOwner = undefined;
		});
	});
}
