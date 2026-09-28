import type { Player, ServerState } from "../shared/types";
import { getOrCreateFarm } from "./farms";

/** Returns the player with this name, creating them (and their farm) if needed. */
export function getOrCreatePlayer(state: ServerState, name: string): Player {
	const existing = state.players.find((p) => p.name === name);
	if (existing) {
		getOrCreateFarm(state, name);
		return existing;
	}

	const player: Player = { name };
	state.players.push(player);
	getOrCreateFarm(state, name);
	return player;
}
