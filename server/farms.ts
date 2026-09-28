import type { Farm, FarmSummary, ServerState } from "../shared/types";
import { createFarm } from "./farm";

/** Returns the named player's farm, creating it if it doesn't exist yet. */
export function getOrCreateFarm(state: ServerState, owner: string): Farm {
	const existing = state.farms[owner];
	if (existing) return existing;
	const farm = createFarm(owner);
	state.farms[owner] = farm;
	return farm;
}

export function farmByOwner(state: ServerState, owner: string): Farm | null {
	return state.farms[owner] ?? null;
}

/**
 * Records a player as a visitor of someone else's farm. Visiting your own farm
 * is a no-op. Returns the farm, or an error if it doesn't exist.
 */
export function visitFarm(
	state: ServerState,
	owner: string,
	visitor: string,
): { farm: Farm } | { error: string } {
	const farm = state.farms[owner];
	if (!farm) return { error: "Farm not found" };
	if (visitor !== owner && !farm.visitors.includes(visitor)) {
		farm.visitors.push(visitor);
	}
	return { farm };
}

/** Removes a visitor from a farm. No-op if they weren't visiting. */
export function leaveFarm(
	state: ServerState,
	owner: string,
	visitor: string,
): Farm | null {
	const farm = state.farms[owner];
	if (!farm) return null;
	farm.visitors = farm.visitors.filter((v) => v !== visitor);
	return farm;
}

export function summarizeFarms(state: ServerState): FarmSummary[] {
	return Object.values(state.farms)
		.map((f) => ({
			owner: f.owner,
			fieldCount: f.field.length,
			seedCount: f.seeds,
			tomatoCount: f.tomatoes,
			visitorCount: f.visitors.length,
		}))
		.sort((a, b) => a.owner.localeCompare(b.owner));
}
