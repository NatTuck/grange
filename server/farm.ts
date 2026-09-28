import { randomUUID } from "node:crypto";
import type { Farm, FarmAction, Plant } from "../shared/types";

const STARTING_SEEDS = 4;
export const SEEDS_PER_TOMATO = 2;

/** A brand new farm: four seeds and an empty field. */
export function createFarm(owner: string): Farm {
	return {
		owner,
		field: [],
		seeds: STARTING_SEEDS,
		tomatoes: 0,
		visitors: [],
	};
}

export type FarmActionResult = { ok: true } | { ok: false; error: string };

function plantSeed(farm: Farm): FarmActionResult {
	if (farm.seeds <= 0) return { ok: false, error: "no seeds to plant" };
	farm.seeds -= 1;
	const plant: Plant = { id: randomUUID(), stage: "seedling" };
	farm.field.push(plant);
	return { ok: true };
}

function grow(farm: Farm, plantId: string): FarmActionResult {
	const plant = farm.field.find((p) => p.id === plantId);
	if (!plant) return { ok: false, error: "no such plant" };
	if (plant.stage !== "seedling") return { ok: false, error: "already grown" };
	plant.stage = "tomato";
	return { ok: true };
}

function harvest(farm: Farm, plantId: string): FarmActionResult {
	const plant = farm.field.find((p) => p.id === plantId);
	if (!plant) return { ok: false, error: "no such plant" };
	if (plant.stage !== "tomato")
		return { ok: false, error: "not ready to harvest" };
	farm.field = farm.field.filter((p) => p.id !== plantId);
	farm.tomatoes += 1;
	return { ok: true };
}

function convertTomato(farm: Farm): FarmActionResult {
	if (farm.tomatoes <= 0) return { ok: false, error: "no tomatoes to convert" };
	farm.tomatoes -= 1;
	farm.seeds += SEEDS_PER_TOMATO;
	return { ok: true };
}

/** Applies one action to a farm, mutating it. Returns an error for illegal actions. */
export function applyFarmAction(
	farm: Farm,
	action: FarmAction,
): FarmActionResult {
	switch (action.kind) {
		case "plantSeed":
			return plantSeed(farm);
		case "grow":
			return grow(farm, action.plantId);
		case "harvest":
			return harvest(farm, action.plantId);
		case "convertTomato":
			return convertTomato(farm);
	}
}
