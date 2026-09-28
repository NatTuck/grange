export type PlantStage = "seedling" | "tomato";

/** A single plant growing in a farm's field. */
export interface Plant {
	id: string;
	stage: PlantStage;
}

/** A player's persistent identity (lobby-side). */
export interface Player {
	name: string;
}

/**
 * One player's farm. Farms are conceptually persistent, but the server holds
 * them in memory only. `seeds` and `tomatoes` are the owner's barn inventory.
 */
export interface Farm {
	owner: string;
	field: Plant[];
	seeds: number;
	tomatoes: number;
	/** Names of other players currently visiting (observing) this farm. */
	visitors: string[];
}

/** A lightweight view of a farm for lobby listings. */
export interface FarmSummary {
	owner: string;
	fieldCount: number;
	seedCount: number;
	tomatoCount: number;
	visitorCount: number;
}

/** A player's request to act on their own farm. */
export type FarmAction =
	| { kind: "plantSeed" }
	| { kind: "grow"; plantId: string }
	| { kind: "harvest"; plantId: string }
	| { kind: "convertTomato" };

export interface ServerState {
	players: Player[];
	/** Farms keyed by owner name. */
	farms: Record<string, Farm>;
}
