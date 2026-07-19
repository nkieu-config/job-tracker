import { test as setup } from "@playwright/test";
import { signInAsDemo, STORAGE_STATE } from "./helpers";

setup("authenticate as the demo account", async ({ page }) => {
  await signInAsDemo(page);
  await page.context().storageState({ path: STORAGE_STATE });
});
