import { io } from "socket.io-client";
import type { Farm, FarmAction, FarmSummary, Player } from "../shared/types";
import { useGameStore } from "./store";

/** Single shared socket connection for the whole SPA. */
export const socket = io();

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

export function emitLogin(
	username: string,
	cb?: (res: LoginAck) => void,
): void {
	socket.emit("login", { username }, cb);
}

export function requestFarms(): void {
	socket.emit("farms", ({ farms }: { farms: FarmSummary[] }) => {
		useGameStore.getState().setFarms(farms);
	});
}

export function emitVisitFarm(
	owner: string,
	cb?: (res: FarmAck) => void,
): void {
	socket.emit("visitFarm", { owner }, cb);
}

export function emitLeaveFarm(cb?: (res: FarmAck) => void): void {
	socket.emit("leaveFarm", cb);
}

export function emitFarmAction(
	owner: string,
	action: FarmAction,
	cb?: (res: FarmAck) => void,
): void {
	socket.emit("farmAction", { owner, action }, cb);
}

/** Registers global socket listeners and restores a saved session, if any. */
export function initSocket(): void {
	socket.on("players", ({ players }: { players: Player[] }) => {
		useGameStore.getState().setPlayers(players);
	});

	socket.on("farms", ({ farms }: { farms: FarmSummary[] }) => {
		useGameStore.getState().setFarms(farms);
	});

	socket.on("farmUpdate", ({ farm }: { farm: Farm }) => {
		useGameStore.getState().setActiveFarm(farm);
	});

	const saved = localStorage.getItem("grange.username");
	if (saved) {
		emitLogin(saved);
	}
}
