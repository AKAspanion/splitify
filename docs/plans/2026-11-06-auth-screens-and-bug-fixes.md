# Auth screens and bug fixes Implementation Plan

**Status:** complete, commits ac12f19..f12e060, 2026-11-06; record: [2026-11-06-auth-screens-and-bug-fixes.record.md](2026-11-06-auth-screens-and-bug-fixes.record.md)

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:feature-build-team by default, or ga:feature-build. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

Plan, then build; tests with each task. Say 'test-first' or 'spec it first' to work that way.

**Goal:** Fix the first batch of reported bugs (no way home from the email-link page, a dialog that slides in from the left, account deletion and passkeys failing, no typed confirmation before deleting an account), replace the landing page with sign-in and sign-up cards laid out like todo.spanion.in, and update the privacy policy for AdSense.

**Architecture:** Five independent slices on the existing static Next.js app and its Cloud Functions. The functions' 403 was an empty Cloud Run IAM policy, granted by hand on 2026-11-06 (`roles/run.invoker` for `allUsers` on `deletemyaccount`, `webauthn`, `reports`); Task 1 makes the two `onRequest` functions declare it so every deploy keeps it. `/` becomes an auth-aware redirect instead of a landing page.

**Tech Stack:** Next.js 16 static export on Firebase Hosting, React, Tailwind v4 with `tailwindcss-animate`, shadcn/Radix (`components/ui/`), Firebase Auth, Cloud Functions v2 (`firebase-functions` 7), Vitest, Playwright (`tests/e2e/`), pnpm. CI is GitHub Actions.

**Spec:** none: a batch of bug fixes and one screen change, settled by the developer's answers on 2026-11-06 (public invoker granted now; ads stay on public pages only; sign-in copies todo's email-behind-a-button layout; typed DELETE on account deletion only).

## Global Constraints

- House rules are `knowledge/project/conventions.md`: kebab-case files, tests beside the file they cover, errors as `sonner` toasts with `toUserMessage` text.
- The AdSense script stays off the signed-in app and the sign-in screens ([decision](../../knowledge/decisions/adsense-on-public-pages-only.md)); a page that loads it leaves for the app by full page loads (plain `<a href>`), never `next/link`.
- Copy is plain sentences with the app's own words, as in `lib/auth/auth-errors.ts`.
- `safeNextPath` (`lib/auth/next-path.ts`) guards every `next` value, unchanged.
- Run each test alone by name; no task runs the whole suite.

## Checkpoints

None (`run.checkpoints: none`).

## Review Focus

- A signed-in person opening `/` must land on `/groups/`, never flash the sign-in card and never load the ad script.
- The typed DELETE field must not accept `delete`, ` DELETE` with spaces kept as-is, or a pasted value with a trailing newline that a person can't see.
- Escape, the overlay or Cancel on the DELETE dialog must not delete, and must free the button.
- After the landing page is removed, every link that pointed to `/` (sign-out, delete success, headers, logo, privacy back link) must still reach a useful screen.
- The privacy page must stay correct about which processors handle data now (Firebase, not Clerk, Vercel, OneSignal or UploadThing).

---

### Task 1: Functions declare a public invoker

**Files:**
- Modify: `functions/src/webauthn/index.ts:378-381`
- Modify: `functions/src/reports/index.ts:57`
- Test: `functions/src/webauthn/webauthn.test.ts`
- Test: `functions/src/reports/reports.test.ts`

**Interfaces:**
- Consumes: existing `webauthn` and `reports` (`onRequest`) exports.
- Produces: both functions' `__endpoint.httpsTrigger.invoker` equals `["public"]`.

**Spec:** none

**Tags:** `security`

**Knowledge:** `operations/deploy-setup: the public HTTP functions declare invoker "public" so each deploy sets roles/run.invoker; the callable deleteMyAccount gets it only when created, so a lost binding is restored with gcloud run services add-iam-policy-binding`

**Acceptance:**
- Given the `webauthn` export, when its endpoint is read, then `httpsTrigger.invoker` is `["public"]`.
- Given the `reports` export, when its endpoint is read, then `httpsTrigger.invoker` is `["public"]`.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `functions/src/webauthn/webauthn.test.ts` and `functions/src/reports/reports.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `cd functions && pnpm vitest run src/webauthn/webauthn.test.ts src/reports/reports.test.ts -t invoker`
Expected: FAIL, `invoker` undefined.

- [x] **Step 3: Write the minimal implementation:** add `invoker: "public"` to both `onRequest` option objects

- [x] **Step 4: Run them to verify they pass**

Run: `cd functions && pnpm vitest run src/webauthn/webauthn.test.ts src/reports/reports.test.ts -t invoker`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add functions/src/webauthn/index.ts functions/src/reports/index.ts functions/src/webauthn/webauthn.test.ts functions/src/reports/reports.test.ts
git commit -m "Declare a public invoker on the webauthn and reports functions so every deploy keeps them callable."
```

### Task 2: Centred dialog and typed DELETE before deleting an account

**Files:**
- Modify: `components/ui/dialog.tsx:42-50`
- Create: `app/(platform)/profile/delete-account-dialog.tsx`
- Create: `app/(platform)/profile/delete-account-dialog.test.tsx`
- Modify: `app/(platform)/profile/delete-account-action.tsx`

**Interfaces:**
- Consumes: existing `deleteMyAccount` flow in `delete-account-action.tsx`, existing `Dialog*` primitives.
- Produces:

```ts
export const DELETE_WORD = "DELETE";
export function DeleteAccountDialog(props: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}): JSX.Element;
```

`DialogContent` opens and closes with fade and `zoom-in-95`/`zoom-out-95` only; the `slide-in-from-left-1/2`, `slide-in-from-top-[48%]` and matching `slide-out-*` classes are removed, so every dialog grows from the centre.

**Spec:** none

**Tags:** `screen`, `failure-paths`

**Knowledge:** `features/profile: Delete account opens a dialog that asks to type DELETE; the Delete account button inside stays disabled until the field is exactly DELETE`, `design-system/components: dialogs open from the centre with fade and zoom, no slide`

**Acceptance:**
- Given the dialog is open, when the field is empty, `delete`, `DELETE ` or `DELET`, then the "Delete account" button is disabled.
- Given the field is exactly `DELETE`, when "Delete account" is pressed, then `onConfirm` is called once.
- Given the field is exactly `DELETE`, when Enter is pressed in the field, then `onConfirm` is called once.
- Given the dialog is open, when Cancel, Escape or the close button is used, then `onCancel` is called and `onConfirm` is not.
- Given the dialog was closed with text typed, when it opens again, then the field is empty.
- The dialog shows the title "Delete your account?", the text "Your shared expenses stay, shown as Deleted user. This can't be undone.", the label "Type DELETE to confirm", and the buttons "Cancel" and "Delete account" (destructive).
- Given the person confirms and `deleteMyAccount` fails with another error, then the toast shows its message and the Profile "Delete account" button is enabled again (existing behaviour kept).
- Given `components/ui/dialog.tsx`, then its content class list holds no `slide-in-from-left` or `slide-out-to-left` class.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `app/(platform)/profile/delete-account-dialog.test.tsx`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run "app/(platform)/profile/delete-account-dialog.test.tsx"`
Expected: FAIL on the assertions, with the component exported with its real signature first.

- [x] **Step 3: Write the minimal implementation:** the dialog, the class change in `dialog.tsx`, and `delete-account-action.tsx` opening `DeleteAccountDialog` instead of `getConfirmation`

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run "app/(platform)/profile/delete-account-dialog.test.tsx"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add components/ui/dialog.tsx "app/(platform)/profile/delete-account-dialog.tsx" "app/(platform)/profile/delete-account-dialog.test.tsx" "app/(platform)/profile/delete-account-action.tsx"
git commit -m "Ask for DELETE before deleting an account, and open dialogs from the centre."
```

### Task 3: A way home from the email-link page

**Files:**
- Modify: `app/(platform)/(auth)/auth/action/action-handler.tsx:68`
- Modify: `app/(platform)/(auth)/auth/action/reset-password-form.tsx`
- Modify: `app/(platform)/(auth)/auth/action/verify-email-result.tsx`
- Test: `app/(platform)/(auth)/auth/action/action-handler.test.ts`
- Test: `app/(platform)/(auth)/auth/action/reset-password-form.test.ts`
- Test: `app/(platform)/(auth)/auth/action/verify-email-result.test.ts`

**Interfaces:**
- Consumes: existing `Header` (`components/container/header.tsx`) with `backTo`; `/` redirects by sign-in state once Task 4 lands, and works as a link before it.
- Produces: none.

**Spec:** none

**Tags:** `screen`, `security`, `failure-paths`

**Knowledge:** `findings/action-page-header-has-no-back-link: Fixed: the header links back to /`, `findings/action-page-failures-have-no-way-back: Fixed: every failed and saved state offers Go home to /`

**Acceptance:**
- Given any link kind, when the page renders, then the header has a back link to `/`.
- Given the reset or verify `failed` state, then it shows "Try again" and an outline "Go home" link to `/`.
- Given the reset `saved` state, then it shows "Sign in" and an outline "Go home" link to `/`.
- Given the verify `verified` state, then "Continue" still links to `/groups/`.
- Given the `incomplete` link, then "Back to sign in" still links to `/sign-in/`.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in the three test files above

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run "app/(platform)/(auth)/auth/action/"`
Expected: FAIL on the new link assertions.

- [x] **Step 3: Write the minimal implementation** of the header link and the "Go home" links

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run "app/(platform)/(auth)/auth/action/"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/(auth)/auth/action/action-handler.tsx" "app/(platform)/(auth)/auth/action/reset-password-form.tsx" "app/(platform)/(auth)/auth/action/verify-email-result.tsx" "app/(platform)/(auth)/auth/action/action-handler.test.ts" "app/(platform)/(auth)/auth/action/reset-password-form.test.ts" "app/(platform)/(auth)/auth/action/verify-email-result.test.ts"
git commit -m "Give the email-link page a way home from every state."
```

### Task 4: Sign-in cards replace the landing page

**Files:**
- Delete: `app/(landing)/page.tsx`, `app/(landing)/page.hosting.tsx`, `app/(landing)/layout.tsx`, `app/(landing)/layout.hosting.tsx`, `app/(landing)/_components/navbar.tsx`, `app/(landing)/_components/navbar.test.tsx`, `app/(landing)/_components/footer.tsx`
- Create: `app/(platform)/(auth)/page.hosting.tsx` (route `/`)
- Create: `app/(platform)/(auth)/home-redirect.tsx`
- Create: `app/(platform)/(auth)/home-redirect.test.tsx`
- Create: `app/(platform)/(auth)/_components/auth-card.tsx`
- Modify: `app/(platform)/(auth)/sign-in/page.hosting.tsx`, `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- Modify: `app/(platform)/(auth)/sign-up/page.hosting.tsx`, `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- Modify: `app/(platform)/(auth)/forgot-password/page.hosting.tsx`, `app/(platform)/(auth)/forgot-password/forgot-password-form.tsx`
- Modify: `app/launch.tsx` (drop the landing-page redirect effect, which `/` now does)
- Modify: `scripts/hosting-pages/public.json`
- Test: `tests/e2e/main-flow.spec.ts`

**Interfaces:**
- Consumes: existing `useAuth()` (`hooks/use-auth.ts`), `Logo` (`components/logo.tsx`), `DarkModeToggle` (`components/theme/dark-mode-toggle.tsx`), the existing form logic of each screen (unchanged: `safeNextPath`, Google redirect return, offline note, errors).
- Produces:

```ts
export function AuthCard(props: {
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}): JSX.Element;
export function HomeRedirect(): JSX.Element;
```

Layout, like todo.spanion.in in Splitify's own tokens: a full-height page, a centred bordered card `max-w-sm`, the Splitify logo mark over the word "Splitify", the subtitle in muted text, the card's actions, then its footer links in small muted text, and the dark-mode toggle at the card's foot (where todo has its language toggle). Shadcn `Button`, `Input`, `Label`, the existing green primary.

| Screen | Subtitle | Card body | Footer |
|---|---|---|---|
| `/sign-in/` | "Sign in to split expenses with friends" | "Continue with Google"; "Sign in with email", which swaps itself for the Email and Password form with "Sign in" and "Forgot your password?" | "New to Splitify? Sign up", "Privacy policy" |
| `/sign-up/` | "Create your account" | Name, Email, Password, "Sign up"; an "or" divider; "Continue with Google" | "Already have an account? Sign in", "Privacy policy" |
| `/forgot-password/` | "Reset your password" | Email, "Send reset link" (existing copy kept) | "Back to sign in" |

`/` renders `HomeRedirect`: a centred spinner while auth loads, then `router.replace("/groups/")` when signed in and `router.replace("/sign-in/")` when signed out. It loads no ad script.

**Spec:** none

**Tags:** `screen`, `security`, `failure-paths`

**Knowledge:** `apps/splitify: / redirects to /groups/ or /sign-in/ by sign-in state; there is no landing page`, `features/sign-in: the screens are one centred card laid out like todo.spanion.in; email sign-in opens behind a "Sign in with email" button; the /auth/action/ page's states each offer a way home`, `decisions/remove-landing-page: the landing page is removed and / redirects, as the developer asked on 2026-11-06`

**Acceptance:**
- Given auth is loading, when `/` renders, then it shows a status "Loading" and navigates nowhere.
- Given a signed-in person, when `/` renders, then it replaces the route with `/groups/`.
- Given a signed-out person, when `/` renders, then it replaces the route with `/sign-in/`.
- Given `/sign-in/` loads, then "Continue with Google" and "Sign in with email" show and no Email field does.
- Given "Sign in with email" is pressed, then the Email and Password fields and the "Sign in" button show, and Email has focus.
- Given a person returns from Google (the redirect marker set), then the Google button is loading as before, without pressing "Sign in with email".
- Given an email sign-in fails, then the form stays open and shows the existing error text.
- Given offline, then every button on the card is disabled and the note "You're offline. Connect to sign in." shows.
- e2e: `tests/e2e/main-flow.spec.ts` opens `/`, lands on `/sign-in/`, presses "Sign in with email", signs in, and the rest of the flow passes; the wrong-password test presses "Sign in with email" first.
- The hosting check expects `/` to serve `index.html` without the text "Splitting Expenses" (now `expectText` "Splitify").

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `app/(platform)/(auth)/home-redirect.test.tsx` and `tests/e2e/main-flow.spec.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run "app/(platform)/(auth)/home-redirect.test.tsx"`
Expected: FAIL on the assertions.

- [x] **Step 3: Write the minimal implementation:** remove the landing route group, add `/` and `AuthCard`, rework the three screens, update `launch.tsx` and `public.json`

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run "app/(platform)/(auth)/home-redirect.test.tsx"`
Expected: PASS

- [x] **Step 5: Run the e2e flow**

Run: `pnpm test:e2e tests/e2e/main-flow.spec.ts`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git rm "app/(landing)/page.tsx" "app/(landing)/page.hosting.tsx" "app/(landing)/layout.tsx" "app/(landing)/layout.hosting.tsx" "app/(landing)/_components/navbar.tsx" "app/(landing)/_components/navbar.test.tsx" "app/(landing)/_components/footer.tsx"
git add "app/(platform)/(auth)/page.hosting.tsx" "app/(platform)/(auth)/home-redirect.tsx" "app/(platform)/(auth)/home-redirect.test.tsx" "app/(platform)/(auth)/_components/auth-card.tsx" "app/(platform)/(auth)/sign-in/page.hosting.tsx" "app/(platform)/(auth)/sign-in/sign-in-form.tsx" "app/(platform)/(auth)/sign-up/page.hosting.tsx" "app/(platform)/(auth)/sign-up/sign-up-form.tsx" "app/(platform)/(auth)/forgot-password/page.hosting.tsx" "app/(platform)/(auth)/forgot-password/forgot-password-form.tsx" app/launch.tsx scripts/hosting-pages/public.json tests/e2e/main-flow.spec.ts
git commit -m "Replace the landing page with a redirect and lay out sign-in, sign-up and reset as one centred card."
```

### Task 5: Privacy policy for AdSense, ads on the delete-account page

**Files:**
- Modify: `app/(platform)/privacy/page.tsx`
- Modify: `app/(platform)/delete-account/page.tsx`
- Create: `app/(platform)/privacy/page.test.tsx`

**Interfaces:**
- Consumes: existing `Adsense` (`app/adsense.tsx`), which already renders nothing for signed-in visitors and in a document that started on `/auth/action`.
- Produces: none.

**Spec:** none

**Tags:** `screen`, `security`

**Knowledge:** `integrations/google-adsense: the ad script loads on the privacy and delete-account pages; no landing layout mounts it any more`, `decisions/adsense-on-public-pages-only: superseded by one naming the privacy and delete-account pages, since the landing page is gone`

**Acceptance:**
- The privacy page's effective date reads "6 November 2026".
- An "Advertising" section says: Splitify shows ads from Google AdSense on its public pages, never inside the signed-in app; Google and its partners use cookies to show ads based on visits to this and other sites; a person can turn off personalised ads at Google's Ads Settings (`https://adssettings.google.com`) or opt out of third-party vendors' cookies at `https://www.aboutads.info`; and it links "How Google uses information from sites that use its services" (`https://policies.google.com/technologies/partner-sites`).
- "Who handles it for us" names what runs today, read from the code (Firebase Authentication, Firebase SQL Connect on Cloud SQL, Cloud Functions, Firebase Hosting, Firebase Cloud Messaging, Google AdSense), and no longer names Clerk, Vercel, OneSignal or UploadThing. The "What we collect" line about page views stays only if the code still measures them.
- "What we collect" adds "Cookies and device identifiers that Google uses to show ads on the public pages."
- The delete-account page mounts `Adsense`, and its links out stay plain anchors.
- The privacy page's back link goes to `/`.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `app/(platform)/privacy/page.test.tsx`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run "app/(platform)/privacy/page.test.tsx"`
Expected: FAIL on the new copy.

- [x] **Step 3: Write the minimal implementation** of the policy text and the delete-account page's `Adsense`

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run "app/(platform)/privacy/page.test.tsx"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/privacy/page.tsx" "app/(platform)/privacy/page.test.tsx" "app/(platform)/delete-account/page.tsx"
git commit -m "Update the privacy policy for AdSense and today's processors, and load ads on the delete-account page."
```
