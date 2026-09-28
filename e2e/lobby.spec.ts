import { expect, test } from "@playwright/test";
import {
	BASE,
	gotoMyFarm,
	login,
	resetServer,
	uniqueName,
	visitFarm,
} from "./helpers";

test("a player can visit another player's farm, but only read-only", async ({
	browser,
}) => {
	await resetServer();
	const aliceName = uniqueName("Alice");
	const bobName = uniqueName("Bob");

	const ctxB = await browser.newContext();
	const bob = await ctxB.newPage();
	await login(bob, bobName);
	await gotoMyFarm(bob);
	await bob.getByRole("button", { name: /Plant Seed/i }).click();
	await expect(bob.getByTestId("seeds")).toHaveText("3");

	const ctxA = await browser.newContext();
	const alice = await ctxA.newPage();
	await login(alice, aliceName);
	await visitFarm(alice, bobName);

	// Alice sees Bob's field and inventory…
	await expect(alice.getByText(/^Seedling$/)).toHaveCount(1);
	await expect(alice.getByTestId("seeds")).toHaveText("3");
	await expect(alice.getByText(/read only/i)).toBeVisible();

	// …but has no action controls.
	await expect(
		alice.getByRole("button", { name: /Plant Seed/i }),
	).toHaveCount(0);
	await expect(alice.getByRole("button", { name: /^Grow$/ })).toHaveCount(0);
	await expect(
		alice.getByRole("button", { name: /Convert Tomato/i }),
	).toHaveCount(0);

	await ctxA.close();
	await ctxB.close();
});

test("a player's own farm offers the farming actions", async ({ browser }) => {
	await resetServer();
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await login(page, uniqueName("Alice"));
	await gotoMyFarm(page);

	await expect(page.getByRole("button", { name: /Plant Seed/i })).toBeVisible();
	await expect(page.getByText(/nothing planted/i)).toBeVisible();

	await ctx.close();
});

test("logging in twice does not create a second farm", async ({ browser }) => {
	await resetServer();
	const name = uniqueName("Alice");
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await login(page, name);
	await gotoMyFarm(page);
	await page.getByRole("button", { name: /Plant Seed/i }).click();
	await expect(page.getByTestId("seeds")).toHaveText("3");

	// Reload the lobby; the session is restored from localStorage.
	await page.goto(`${BASE}/dashboard`);
	await gotoMyFarm(page);
	await expect(page.getByTestId("seeds")).toHaveText("3");

	await ctx.close();
});