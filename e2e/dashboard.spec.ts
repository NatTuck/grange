import { expect, test } from "@playwright/test";
import { login, resetServer, uniqueName } from "./helpers";

test("the lobby lists other farms and the Visit button opens one", async ({
	browser,
}) => {
	await resetServer();
	const aliceName = uniqueName("Alice");
	const bobName = uniqueName("Bob");

	const ctxB = await browser.newContext();
	const bob = await ctxB.newPage();
	await login(bob, bobName);

	const ctxA = await browser.newContext();
	const alice = await ctxA.newPage();
	await login(alice, aliceName);

	await expect(alice.getByText(bobName)).toBeVisible();
	await alice.getByRole("button", { name: /^Visit$/ }).click();
	await alice.waitForURL(new RegExp(`/farms/${bobName}$`));
	await expect(alice.getByText(/read only/i)).toBeVisible();

	await ctxA.close();
	await ctxB.close();
});

test("the lobby shows the player's own farm and opens its field", async ({
	browser,
}) => {
	await resetServer();
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await login(page, uniqueName("Alice"));

	await expect(page.getByRole("button", { name: /Go to field/i })).toBeVisible();
	await page.getByRole("button", { name: /Go to field/i }).click();
	await page.waitForURL(/\/farms\/.+/);
	await expect(page.getByText(/^FIELD$/)).toBeVisible();

	await ctx.close();
});