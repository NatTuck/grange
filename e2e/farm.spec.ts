import { expect, test } from "@playwright/test";
import { gotoMyFarm, login, resetServer, uniqueName } from "./helpers";

test("acceptance: plant, grow, harvest, convert ends with one tomato and four seeds", async ({
	page,
}) => {
	await resetServer();
	await login(page, uniqueName("Farmer"));
	await gotoMyFarm(page);

	const seeds = page.getByTestId("seeds");
	const tomatoes = page.getByTestId("tomatoes");

	// Start with 4 seeds.
	await expect(seeds).toHaveText("4");
	await expect(tomatoes).toHaveText("0");

	// Plant two seeds.
	const plantButton = page.getByRole("button", { name: /Plant Seed/i });
	await plantButton.click();
	await plantButton.click();
	await expect(seeds).toHaveText("2");
	await expect(page.getByText(/^Seedling$/)).toHaveCount(2);

	// Grow them to tomato plants.
	const grow = page.getByRole("button", { name: /^Grow$/ });
	await grow.first().click();
	await grow.first().click();
	await expect(page.getByText(/^Tomato plant$/)).toHaveCount(2);

	// Harvest them into the barn.
	const harvest = page.getByRole("button", { name: /^Harvest$/ });
	await harvest.first().click();
	await harvest.first().click();
	await expect(page.getByTestId("field-empty")).toBeVisible();
	await expect(tomatoes).toHaveText("2");
	await expect(seeds).toHaveText("2");

	// Convert one tomato into two seeds.
	await page.getByRole("button", { name: /Convert Tomato/i }).click();
	await expect(tomatoes).toHaveText("1");
	await expect(seeds).toHaveText("4");
});