// The verify-email banner (knowledge/decisions/verify-banner-placement.md): an unverified person sees it on Groups until
// they press Dismiss, and always on Profile. The fixture's test user is made unverified, so no setup is needed.
import { expect, test } from "./fixtures";

const BANNER_TEXT = /Verify your email to keep your account safe/;

test("shows the banner on Groups until dismissed, and always on Profile", async ({
  page,
  testUser,
}) => {
  await test.step("sign in and see the banner on Groups", async () => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in\/$/);
    await page.getByRole("button", { name: "Sign in with email" }).click();
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/groups\/?$/);
    await expect(page.getByText(BANNER_TEXT)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resend email" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "I've verified" }),
    ).toHaveCount(0);
  });

  await test.step("dismiss it and it stays gone after a reload", async () => {
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.getByText(BANNER_TEXT)).toHaveCount(0);
    await page.reload();
    await expect(page).toHaveURL(/\/groups\/?$/);
    // Groups has rendered once the page's own heading or empty state is there; the banner must still be absent.
    await expect(
      page.getByText("Create a group", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(BANNER_TEXT)).toHaveCount(0);
  });

  await test.step("Profile shows it with no Dismiss", async () => {
    await page.goto("/profile/");
    await expect(page.getByText(BANNER_TEXT)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resend email" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Dismiss" })).toHaveCount(0);
  });
});
