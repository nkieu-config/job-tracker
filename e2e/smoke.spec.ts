import { test, expect } from "@playwright/test";
import { signInAsDemo, sectionByHeading } from "./helpers";

// A read-only smoke suite over the seeded demo account. It deliberately avoids
// the AI actions (they spend the shared hourly budget) and the create/edit/
// delete and upload flows (they mutate the shared demo data other visitors see)
// — those paths are covered by the unit and integration tests. What's left is
// the navigation and rendering that only a real browser can confirm.

test.describe("signed in as the demo account", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemo(page);
  });

  test("the dashboard renders every section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: /Welcome/ }),
    ).toBeVisible();
    await expect(page.getByText("Response rate")).toBeVisible();
    for (const heading of ["Pipeline", "Activity", "Coaching", "Upcoming deadlines"]) {
      await expect(sectionByHeading(page, heading)).toBeVisible();
    }
    // The insights I added: a deterministic skill-gap card and the AI coach.
    await expect(
      page.getByRole("heading", { name: "Skills to focus on" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI coach" })).toBeVisible();
  });

  test("a pipeline stage links through to the filtered list", async ({ page }) => {
    const applied = sectionByHeading(page, "Pipeline")
      .getByRole("link")
      .filter({ hasText: /Applied/ })
      .first();
    await applied.click();
    await page.waitForURL(/status=APPLIED/);
    await expect(page.getByLabel("Search applications")).toBeVisible();
  });

  test("the Applications nav opens the list with the seeded roles", async ({ page }) => {
    await page.getByRole("link", { name: "Applications" }).click();
    await page.waitForURL("**/dashboard/applications**");
    await expect(page.getByLabel("Search applications")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Senior Backend Engineer/ }),
    ).toBeVisible();
  });

  test("an application detail page shows the AI analysis sections", async ({ page }) => {
    await page.goto("/dashboard/applications");
    await page
      .getByRole("link", { name: /Senior Backend Engineer/ })
      .first()
      .click();
    await page.waitForURL(/\/dashboard\/applications\/[^/]+$/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Skills analysis" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Resume fit" }),
    ).toBeVisible();
  });

  test("the new-application form offers AI auto-fill", async ({ page }) => {
    await page.goto("/dashboard/applications/new");
    await expect(page.getByLabel("Company")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Auto-fill from description/ }),
    ).toBeVisible();
  });

  test("signing out returns to the sign-in page", async ({ page }) => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/sign-in");
  });
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
