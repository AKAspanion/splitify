// The legal pages (knowledge/features/legal-pages.md): public, and reached from the sign-in screens by full page loads,
// never client navigation, so the ad script on the privacy page never follows into the app
// (knowledge/decisions/adsense-on-privacy-and-delete-account-pages.md). Nobody signs in, so no fixtures are needed.
import { expect, test } from "@playwright/test";

const MARKER = "__legalPagesMarker";

test("the legal pages open from the sign-in screens by full page loads", async ({
  page,
}) => {
  await test.step("sign-in links the terms and a click is a full page load", async () => {
    await page.goto("/sign-in/");
    await page.evaluate((key) => {
      (window as unknown as Record<string, boolean>)[key] = true;
    }, MARKER);
    await page.getByRole("link", { name: "Terms of service" }).click();
    await expect(page).toHaveURL(/\/terms\/$/);
    await expect(
      page.getByText("Terms of Service", { exact: true }),
    ).toBeVisible();
    // A client navigation keeps the window, and so the marker; a full page load drops it.
    expect(await page.evaluate((key) => key in window, MARKER)).toBe(false);
  });

  await test.step("the terms page loads no ad script", async () => {
    await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  });

  await test.step("the terms link the privacy policy by a full page load", async () => {
    await page.evaluate((key) => {
      (window as unknown as Record<string, boolean>)[key] = true;
    }, MARKER);
    await page
      .getByRole("article")
      .getByRole("link", { name: "privacy policy" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/privacy\/$/);
    await expect(
      page.getByText("Privacy Policy", { exact: true }),
    ).toBeVisible();
    expect(await page.evaluate((key) => key in window, MARKER)).toBe(false);
  });

  await test.step("sign-up links the terms too", async () => {
    await page.goto("/sign-up/");
    await expect(
      page.getByRole("link", { name: "Terms of service" }),
    ).toHaveAttribute("href", "/terms/");
  });
});
