import { describe, expect, it } from "vitest";
import type { ServerState } from "../shared/types";
import {
	farmByOwner,
	getOrCreateFarm,
	leaveFarm,
	summarizeFarms,
	visitFarm,
} from "./farms";

function freshState(): ServerState {
	return { players: [], farms: {} };
}

describe("farms", () => {
	it("creates a farm with four seeds on first access", () => {
		const state = freshState();
		const farm = getOrCreateFarm(state, "Alice");
		expect(farm.owner).toBe("Alice");
		expect(farm.seeds).toBe(4);
		expect(state.farms.Alice).toBe(farm);
	});

	it("returns the same farm on repeat calls", () => {
		const state = freshState();
		const first = getOrCreateFarm(state, "Alice");
		const second = getOrCreateFarm(state, "Alice");
		expect(second).toBe(first);
	});

	it("records and removes visitors, never the owner", () => {
		const state = freshState();
		getOrCreateFarm(state, "Alice");
		visitFarm(state, "Alice", "Bob");
		visitFarm(state, "Alice", "Bob");
		visitFarm(state, "Alice", "Alice");
		expect(state.farms.Alice.visitors).toEqual(["Bob"]);

		leaveFarm(state, "Alice", "Bob");
		expect(state.farms.Alice.visitors).toEqual([]);
	});

	it("reports a missing farm", () => {
		const state = freshState();
		expect(visitFarm(state, "Nobody", "Bob")).toEqual({
			error: "Farm not found",
		});
		expect(farmByOwner(state, "Nobody")).toBeNull();
	});

	it("summarizes farms for the lobby", () => {
		const state = freshState();
		const alice = getOrCreateFarm(state, "Alice");
		alice.seeds = 2;
		alice.tomatoes = 3;
		visitFarm(state, "Alice", "Bob");

		const summary = summarizeFarms(state).find((s) => s.owner === "Alice");
		expect(summary).toEqual({
			owner: "Alice",
			fieldCount: 0,
			seedCount: 2,
			tomatoCount: 3,
			visitorCount: 1,
		});
	});
});
