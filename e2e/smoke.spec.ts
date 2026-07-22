import { test, expect } from "@playwright/test";
import { signInAsDemo, sectionByHeading } from "./helpers";

// A read-only smoke suite over the seeded demo account. It deliberately avoids
// the AI actions (they spend the shared hourly budget) and the create/edit/
// delete and upload flows (they mutate the shared demo data other visitors see)
// — those paths are covered by the unit and integration tests. What's left is
// the navigation and rendering that only a real browser can confirm.
//
// Authentication comes from the setup project's saved storage state — the app
// rate-limits sign-in, so tests must not sign in individually.

test.describe("signed in as the demo account", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("Today leads with what needs doing, then how the search is going", async ({
    page,
  }) => {
    // The headline counts the agenda, so it reads either way round depending on
    // the demo data — what matters is that the page is about today.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /worth doing|Nothing is waiting/,
    );

    for (const heading of ["How the search is going", "Every deadline ahead"]) {
      await expect(sectionByHeading(page, heading)).toBeVisible();
    }
    await expect(page.getByText("Response", { exact: true })).toBeVisible();

    // A deterministic skill-gap card and the AI coach.
    await expect(
      page.getByRole("heading", { name: "Skills to focus on" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI coach" })).toBeVisible();
  });

  test("a pipeline stage links through to the filtered list", async ({ page }) => {
    const applied = sectionByHeading(page, "How the search is going")
      .getByRole("link")
      .filter({ hasText: /Applied/ })
      .first();
    await applied.click();
    await page.waitForURL(/status=APPLIED/);
    await expect(page.getByLabel("Search applications")).toBeVisible();
  });

  test("the Applications nav opens the board with the seeded roles", async ({ page }) => {
    await page.getByRole("link", { name: "Applications" }).click();
    await page.waitForURL("**/dashboard/applications**");
    await expect(
      page.getByRole("link", { name: /Senior Backend Engineer/ }).first(),
    ).toBeVisible();
    await page.goto("/dashboard/applications?view=list");
    await expect(page.getByLabel("Search applications")).toBeVisible();
  });

  test("the desk shows the posting beside the AI panels", async ({ page }) => {
    await page.goto("/dashboard/applications");
    await page
      .getByRole("link", { name: /Senior Backend Engineer/ })
      .first()
      .click();
    await page.waitForURL(/\/dashboard\/applications\/[^/]+$/);

    await expect(
      page.getByRole("heading", { level: 2, name: "Job posting" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Skills analysis" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Resume fit" }),
    ).toBeVisible();

    // Switching tabs must not unmount the others — a stream in flight on a
    // hidden panel has to survive.
    await page.getByRole("tab", { name: "Prep" }).click();
    await expect(page.getByRole("tab", { name: "Prep" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("heading", { level: 2, name: "Skills analysis" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: /prep sheet/i }),
    ).toBeVisible();
  });

  test("the new-application form offers AI auto-fill", async ({ page }) => {
    await page.goto("/dashboard/applications/new");
    await expect(page.getByLabel("Company")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Auto-fill from description/ }),
    ).toBeVisible();
  });

});

// Signing out revokes the server-side session that every other test shares, so
// this flow runs in its own context with a fresh sign-in of its own.
test.describe("session lifecycle", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("signing in and out round-trips back to the sign-in page", async ({
    page,
  }) => {
    await signInAsDemo(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/sign-in");
  });

  test("visiting the dashboard while signed out redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/sign-in**");
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
  });
});
