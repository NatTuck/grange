import { describe, expect, it } from "vitest";
import type { Farm } from "../shared/types";
import { applyFarmAction, createFarm } from "./farm";

function plant(farm: Farm, count: number): void {
	for (let i = 0; i < count; i++) {
		expect(applyFarmAction(farm, { kind: "plantSeed" })).toEqual({ ok: true });
	}
}

describe("createFarm", () => {
	it("starts with 4 seeds, no tomatoes, and an empty field", () => {
		const farm = createFarm("Alice");
		expect(farm).toMatchObject({
			owner: "Alice",
			field: [],
			seeds: 4,
			tomatoes: 0,
			visitors: [],
		});
	});
});

describe("plantSeed", () => {
	it("moves a seed into the field as a seedling", () => {
		const farm = createFarm("Alice");
		expect(applyFarmAction(farm, { kind: "plantSeed" })).toEqual({ ok: true });
		expect(farm.seeds).toBe(3);
		expect(farm.field).toHaveLength(1);
		expect(farm.field[0].stage).toBe("seedling");
	});

	it("rejects planting with no seeds", () => {
		const farm = createFarm("Alice");
		plant(farm, 4);
		expect(applyFarmAction(farm, { kind: "plantSeed" })).toEqual({
			ok: false,
			error: "no seeds to plant",
		});
		expect(farm.field).toHaveLength(4);
	});
});

describe("grow", () => {
	it("turns a seedling into a tomato plant", () => {
		const farm = createFarm("Alice");
		plant(farm, 1);
		const id = farm.field[0].id;
		expect(applyFarmAction(farm, { kind: "grow", plantId: id })).toEqual({
			ok: true,
		});
		expect(farm.field[0].stage).toBe("tomato");
	});

	it("rejects an unknown plant and a plant that is already grown", () => {
		const farm = createFarm("Alice");
		plant(farm, 1);
		const id = farm.field[0].id;
		expect(applyFarmAction(farm, { kind: "grow", plantId: "nope" })).toEqual({
			ok: false,
			error: "no such plant",
		});
		applyFarmAction(farm, { kind: "grow", plantId: id });
		expect(applyFarmAction(farm, { kind: "grow", plantId: id })).toEqual({
			ok: false,
			error: "already grown",
		});
	});
});

describe("harvest", () => {
	it("removes a tomato plant and adds a tomato to the barn", () => {
		const farm = createFarm("Alice");
		plant(farm, 1);
		const id = farm.field[0].id;
		applyFarmAction(farm, { kind: "grow", plantId: id });
		expect(applyFarmAction(farm, { kind: "harvest", plantId: id })).toEqual({
			ok: true,
		});
		expect(farm.field).toHaveLength(0);
		expect(farm.tomatoes).toBe(1);
	});

	it("rejects harvesting a seedling", () => {
		const farm = createFarm("Alice");
		plant(farm, 1);
		const id = farm.field[0].id;
		expect(applyFarmAction(farm, { kind: "harvest", plantId: id })).toEqual({
			ok: false,
			error: "not ready to harvest",
		});
	});
});

describe("convertTomato", () => {
	it("turns one tomato into two seeds", () => {
		const farm = createFarm("Alice");
		farm.tomatoes = 1;
		expect(applyFarmAction(farm, { kind: "convertTomato" })).toEqual({
			ok: true,
		});
		expect(farm.tomatoes).toBe(0);
		expect(farm.seeds).toBe(6);
	});

	it("rejects converting with no tomatoes", () => {
		const farm = createFarm("Alice");
		expect(applyFarmAction(farm, { kind: "convertTomato" })).toEqual({
			ok: false,
			error: "no tomatoes to convert",
		});
	});
});

describe("acceptance scenario", () => {
	it("ends with one tomato and four seeds", () => {
		const farm = createFarm("Alice");
		expect(farm.seeds).toBe(4);

		plant(farm, 2);
		expect(farm.seeds).toBe(2);
		expect(farm.field).toHaveLength(2);

		for (const p of farm.field) {
			applyFarmAction(farm, { kind: "grow", plantId: p.id });
		}
		expect(farm.field.every((p) => p.stage === "tomato")).toBe(true);

		const ids = farm.field.map((p) => p.id);
		for (const id of ids) {
			applyFarmAction(farm, { kind: "harvest", plantId: id });
		}
		expect(farm.tomatoes).toBe(2);
		expect(farm.seeds).toBe(2);

		expect(applyFarmAction(farm, { kind: "convertTomato" })).toEqual({
			ok: true,
		});
		expect(farm.tomatoes).toBe(1);
		expect(farm.seeds).toBe(4);
	});
});
