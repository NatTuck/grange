import type { Page } from "@playwright/test";

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/** Unique suffix so tests don't collide with each other or prior runs. */
export function uniqueName(base: string): string {
	return `${base}-${Math.floor(Math.random() * 1e9)}`;
}

/** Resets the server's in-memory state so each test starts clean. */
export async function resetServer(): Promise<void> {
	await fetch(`${BASE}/api/reset`, { method: "POST" });
}

export async function login(page: Page, name: string): Promise<void> {
	await page.goto(BASE);
	await page.locator("input").fill(name);
	await page.getByRole("button", { name: /^Enter$/i }).click();
	await page.waitForURL("**/dashboard");
}

/** Navigates from the lobby to the logged-in user's own field. */
export async function gotoMyFarm(page: Page): Promise<void> {
	await page.getByRole("button", { name: /Go to field/i }).click();
	await page.waitForURL(/\/farms\/.+/);
}

/** Visits another player's farm (read-only). */
export async function visitFarm(page: Page, owner: string): Promise<void> {
	await page.goto(`${BASE}/farms/${encodeURIComponent(owner)}`);
	await page.getByText(/FIELD/).waitFor();
}