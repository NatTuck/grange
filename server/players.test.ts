import { describe, expect, it } from "vitest";
import { getOrCreatePlayer } from "./players";
import { state } from "./state";

describe("getOrCreatePlayer", () => {
	it("creates a player and their farm when new", () => {
		const player = getOrCreatePlayer(state, "Alice");
		expect(player.name).toBe("Alice");
		expect(state.players).toContain(player);
		expect(state.farms.Alice.seeds).toBe(4);
	});

	it("returns the existing player on repeat calls", () => {
		const first = getOrCreatePlayer(state, "Alice");
		const second = getOrCreatePlayer(state, "Alice");
		expect(second).toBe(first);
		expect(state.players.filter((p) => p.name === "Alice")).toHaveLength(1);
	});
});
