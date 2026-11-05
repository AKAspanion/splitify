# Password Reset Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:feature-build-team by default, or ga:feature-build. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

Plan, then build; tests with each task. Say 'test-first' or 'spec it first' to work that way.

**Goal:** The link in Firebase's password-reset email opens a Splitify page, `/auth/action/`, where the person chooses
a new password. The same page finishes the verify-email link, because Firebase sends every auth email to one action URL.

**Architecture:** Today `sendPasswordReset` (`lib/firebase/auth.ts`) sends Firebase's reset email, and its link opens
Firebase's generic page at `https://splitify.spanion.in/__/auth/action`. The app adds its own handler page, a static
route in the hosting build. The page reads `mode` and `oobCode` from the link, removes them from the address bar,
and either resets the password (`verifyPasswordResetCode`, then `confirmPasswordReset`) or verifies the email
(`applyActionCode`). Any other mode (`recoverEmail`, `verifyAndChangeEmail`, `revertSecondFactorAddition`) goes on to
Firebase's own handler, which Hosting still serves at `/__/auth/action`. The one-time code stays out of the service
worker's cache and away from the AdSense script. Once this ships, the developer changes the action URL in the
Firebase console (an outside step, listed under Knowledge).

**Tech Stack:** Next.js 16 static export on Firebase Hosting (`firebase.json`), Firebase Auth web SDK
(`firebase` in `package.json`), Vitest (`vitest.config.mts`; the Auth emulator tests through `pnpm test:rules`,
`vitest.rules.config.mts`), shadcn components in `components/ui/`, pnpm. CI is GitHub Actions (`.github/workflows/`).

**Spec:** none. The change is small (three tasks), and the behaviour comes from verified concepts:
`knowledge/features/sign-in.md`, `knowledge/decisions/firebase-auth.md` ("Password reset is Firebase's reset
email") and `knowledge/operations/deploy-setup.md` (the action URL).

## Global Constraints

- Errors are the app's own words, never Firebase's message: every failure goes through `authErrorMessage`
  (`lib/auth/auth-errors.ts`); an unknown code reads "Something went wrong. Try again."
- A new password needs at least 8 characters, the sign-up rule: "Use at least 8 characters."
- The page is offline-aware like the other auth screens: `OfflineSignInNote` shows and the submit button is disabled
  while offline (`components/offline/offline-sign-in-note.tsx`, `hooks/use-online.ts`).
- The one-time code (`oobCode`) is never logged, never put in a URL the app builds (forwarding to Firebase's own
  handler excepted), and never stored by the app or its service worker.
- Files are kebab-case. Only `*.hosting.tsx` files are routes. Tests sit beside the file they cover
  (`knowledge/project/conventions.md`).
- No new dependency.
- The repository has no end-to-end runner yet: `knowledge/decisions/e2e-main-flows.md` leaves the runner open, and
  `checks.commands.e2e` is null. So the screen task adds no Playwright test, and the merge request goes without the
  feature video. The pure logic behind the screen is unit tested instead (`lib/auth/action-link.ts`).

## Checkpoints

None: `run.checkpoints` is `none` and the run is unattended. A security task's checkpoint becomes a one-line summary
in the ledger.

## Review Focus

- A link opened twice (the email client's link preview often opens it first): the second open must say the link has
  expired or was already used, never "Something went wrong".
- A link whose `oobCode` is missing or empty, or whose `mode` is unknown: the person sees "This link isn't complete.
  Open it again from the email." Nothing is called with an empty code.
- A person signed in on this browser who verifies their email here: the verify-email banner must clear without a
  reload (`reloadEmailVerified`).
- Reloading the page after the address bar was cleaned: the code is gone, so the page says the link isn't complete.
  It must not crash or call Firebase with nothing.
- The code reaching a third party or the cache: no AdSense script on `/auth/action/`, and the service worker never
  stores or answers that path.

---

### Task 1: Action link parsing and the Auth calls behind it

**Files:**
- Create: `lib/auth/action-link.ts`
- Test: `lib/auth/action-link.test.ts`
- Modify: `lib/firebase/auth.ts`
- Test: `lib/firebase/auth.test.ts` (runs on the Auth emulator through `pnpm test:rules`)
- Modify: `lib/auth/auth-errors.ts`
- Test: `lib/auth/auth-errors.test.ts`

**Interfaces:**
- Consumes: existing `getFirebaseAuth()` (`lib/firebase/app.ts`) and existing `reloadEmailVerified()` (`lib/firebase/auth.ts`)
- Produces:

```ts
// lib/auth/action-link.ts
export const ACTION_PATH = "/auth/action/";
export const FIREBASE_ACTION_HANDLER = "/__/auth/action";

export type ActionLink =
  | { kind: "reset-password"; code: string }
  | { kind: "verify-email"; code: string }
  | { kind: "firebase"; forwardTo: string } // FIREBASE_ACTION_HANDLER + the link's own query string, unchanged
  | { kind: "incomplete" };

/** Reads a Firebase email action link's query string (with or without its leading "?"). */
export function parseActionLink(search: string): ActionLink;

// lib/firebase/auth.ts
/** The email a reset code belongs to. Rejects with Firebase's error (expired, invalid, disabled user). */
export function readPasswordResetEmail(code: string): Promise<string>;
/** Sets the new password with the reset code. Rejects with Firebase's error. */
export function resetPassword(code: string, newPassword: string): Promise<void>;
/** Applies a verify-email code; when someone is signed in on this browser, reloads them and refreshes their token so the banner clears. */
export function verifyEmailWithCode(code: string): Promise<void>;
```

**Spec:** none. `knowledge/features/sign-in.md`: "Errors are the app's own words, never Firebase's message".

**Tags:** `security`, `failure-paths`

**Knowledge:** (written by the end-of-plan knowledge job)
- `features/sign-in`: a reset link opens `/auth/action/`, where the person sets a new password of at least 8
  characters; an expired or used link says "This link has expired or was already used."
- `decisions/firebase-auth`: password reset is still Firebase's reset email, now finished on the app's own page.

**Acceptance:**
- `parseActionLink("?mode=resetPassword&oobCode=abc&apiKey=k&lang=en")` gives `{ kind: "reset-password", code: "abc" }`.
- `parseActionLink("mode=verifyEmail&oobCode=xyz")` (no leading `?`) gives `{ kind: "verify-email", code: "xyz" }`.
- `parseActionLink("?mode=recoverEmail&oobCode=r1&apiKey=k")` gives `{ kind: "firebase", forwardTo: "/__/auth/action?mode=recoverEmail&oobCode=r1&apiKey=k" }`, and the same for `verifyAndChangeEmail` and `revertSecondFactorAddition`.
- A missing `oobCode`, an empty `oobCode`, an `oobCode` of only spaces, a missing `mode`, an unknown `mode` (`"deleteEverything"`), or an empty string each give `{ kind: "incomplete" }`; none gives `kind: "firebase"`.
- `forwardTo` always starts with `/__/auth/action?`: a `mode` or `oobCode` value carrying `//evil.example`, `https://evil.example` or `\n` can't change the path it forwards to. A `continueUrl` in the link is never read or followed.
- `authErrorMessage` maps `auth/expired-action-code` and `auth/invalid-action-code` to "This link has expired or was already used.", `auth/weak-password` to "Use at least 8 characters.", and `auth/user-disabled` to "This account is turned off."; the existing mappings are unchanged.
- On the Auth emulator: after `sendPasswordReset("reset2@example.test")` for a signed-up address, the emulator's `oobCodes` endpoint gives that request's `oobCode`; `readPasswordResetEmail(code)` resolves `"reset2@example.test"`; `resetPassword(code, "new-password-456")` resolves; `signInWithEmail("reset2@example.test", "new-password-456")` then succeeds and the old password is refused.
- On the Auth emulator: `resetPassword` with a code that was already used rejects with code `auth/invalid-action-code`, and `readPasswordResetEmail("not-a-code")` rejects with code `auth/invalid-action-code`.
- On the Auth emulator: after `signUpWithEmail` (still signed in, `emailVerified` false), `verifyEmailWithCode` with the `VERIFY_EMAIL` code from `oobCodes` resolves, and `onUserChanged`'s latest user, or `reloadEmailVerified()`, shows `emailVerified: true`. Called again with the same code, it rejects with `auth/invalid-action-code`.
- On the Auth emulator: `verifyEmailWithCode` with a valid code and nobody signed in resolves without throwing.

- [ ] **Step 1: Write the failing tests** for each Acceptance case: the parsing and error cases in `lib/auth/action-link.test.ts` and `lib/auth/auth-errors.test.ts`, the emulator cases in `lib/firebase/auth.test.ts` (its `oobCodes()` helper reads the emulator's codes; widen its return type to include `oobCode`)

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `pnpm vitest run lib/auth/action-link.test.ts lib/auth/auth-errors.test.ts`
Expected: FAIL on the assertions. Create `lib/auth/action-link.ts` with its real exports first, so the tests fail on behaviour, not on a missing module

- [ ] **Step 3: Run the emulator tests to verify they fail**

Run: `pnpm test:rules`
Expected: the new `lib/firebase/auth.test.ts` cases FAIL (the three functions exist with their signatures but do nothing); the existing cases pass

- [ ] **Step 4: Write the minimal implementation** to the Interfaces: `parseActionLink` with `URLSearchParams`, the three Auth functions over `verifyPasswordResetCode`, `confirmPasswordReset` and `applyActionCode`, and the four new error messages

- [ ] **Step 5: Run the unit tests to verify they pass**

Run: `pnpm vitest run lib/auth/action-link.test.ts lib/auth/auth-errors.test.ts`
Expected: PASS

- [ ] **Step 6: Run the emulator tests to verify they pass**

Run: `pnpm test:rules`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/auth/action-link.ts lib/auth/action-link.test.ts lib/firebase/auth.ts lib/firebase/auth.test.ts lib/auth/auth-errors.ts lib/auth/auth-errors.test.ts
git commit -m "Read Firebase's email action links and add the reset-password and verify-email calls behind them."
```

### Task 2: The `/auth/action/` page

**Files:**
- Create: `app/(platform)/(auth)/auth/action/page.hosting.tsx`
- Create: `app/(platform)/(auth)/auth/action/action-handler.tsx`
- Create: `app/(platform)/(auth)/auth/action/reset-password-form.tsx`
- Create: `app/(platform)/(auth)/auth/action/verify-email-result.tsx`

**Interfaces:**
- Consumes: `parseActionLink`, `ActionLink`, `ACTION_PATH` from `lib/auth/action-link.ts` (Task 1);
  `readPasswordResetEmail`, `resetPassword`, `verifyEmailWithCode` from `lib/firebase/auth.ts` (Task 1);
  `authErrorMessage` with its new messages (Task 1); existing `Header` (`components/container/header`), `Button`,
  `Input`, `Label` (`components/ui/`), `OfflineSignInNote`, `useOnline`.
- Produces: the route `/auth/action/` in the hosting output (`out/auth/action/index.html`).

The page wrapper follows `app/(platform)/(auth)/forgot-password/page.hosting.tsx`: a `Header` and the client
handler inside `Suspense`. The handler reads `window.location.search` once on mount, calls `parseActionLink`, and at
once replaces the address bar with `ACTION_PATH` (`history.replaceState`), so the code doesn't stay in the URL. It
keeps the parsed link in state, so its own re-renders don't lose it. For `kind: "firebase"` it calls
`window.location.replace(forwardTo)`.

**Spec:** none. Copy for each state is in the Acceptance cases below.

**Tags:** `screen`, `security`, `failure-paths`

**Knowledge:** (written by the end-of-plan knowledge job)
- `features/sign-in`: the `/auth/action/` page, its states and its copy; the verify link clears the banner when the
  person is signed in on that browser.
- `apps/splitify`: the hosting build has a `/auth/action/` page.

**Acceptance:**
- Given a reset link, while `readPasswordResetEmail` is pending, the page shows "Checking your link…" with no form.
- Given a valid reset link, the header reads "Choose a new password", the page shows "For <email>", a "New password" field (`type="password"`, `autoComplete="new-password"`) and a "Save password" button.
- Given a password of 7 characters, Save password shows "Use at least 8 characters." and calls nothing.
- Given a valid password, the button shows its spinner and is disabled while `resetPassword` runs; on success the form is replaced by "Your password is changed. Sign in with your new password." and a "Sign in" link to `/sign-in/`.
- Given an expired or used reset link (`auth/expired-action-code` or `auth/invalid-action-code`, from either call), the page shows "This link has expired or was already used." and an "Ask for a new link" link to `/forgot-password/`, with no form.
- Given `resetPassword` fails with `auth/network-request-failed`, the form stays, the typed password is kept, and the page shows "Couldn't reach Splitify. Check your connection."; pressing Save password again retries.
- Given `readPasswordResetEmail` fails with `auth/network-request-failed`, the page shows "Couldn't reach Splitify. Check your connection." and a "Try again" button that checks the link again.
- Given the browser is offline, the Save password button is disabled and `OfflineSignInNote` shows.
- Given a verify-email link, the page shows "Checking your link…", then "Your email is verified." and a "Continue" link to `/groups/`; an expired or used one shows "This link has expired or was already used." and a "Go to Splitify" link to `/groups/`; a network failure shows its message and "Try again".
- Given a `recoverEmail` link, the browser goes on to `/__/auth/action?` with the link's own query string.
- Given an incomplete link (`kind: "incomplete"`), the page shows "This link isn't complete. Open it again from the email." and a "Back to sign in" link to `/sign-in/`, and calls no Auth function.
- Given any link, once the page has read it, the address bar shows `/auth/action/` with no query string.
- `pnpm build` writes `out/auth/action/index.html`.

- [ ] **Step 1: Write the page wrapper and the handler's state switch** to the Interfaces, rendering "Checking your link…" for every state

- [ ] **Step 2: Build it to verify the route exists**

Run: `pnpm build`
Expected: the build passes and `out/auth/action/index.html` exists

- [ ] **Step 3: Write the reset form and the verify result** with each Acceptance state's copy

- [ ] **Step 4: Walk each state in the running dev server** (`ga.mjs run dev`): open `/auth/action/?mode=resetPassword&oobCode=<code from the Auth emulator's oobCodes>`, a used code, `?mode=verifyEmail&oobCode=<code>`, `?mode=recoverEmail&oobCode=x`, and `/auth/action/` alone. Check each state's copy, and that the address bar is cleaned, at 390 and 1280 pixels wide

- [ ] **Step 5: Commit**

```bash
git add "app/(platform)/(auth)/auth/action/page.hosting.tsx" "app/(platform)/(auth)/auth/action/action-handler.tsx" "app/(platform)/(auth)/auth/action/reset-password-form.tsx" "app/(platform)/(auth)/auth/action/verify-email-result.tsx"
git commit -m "Add the /auth/action/ page, where a reset link sets a new password and a verify link verifies the email."
```

### Task 3: Keep the one-time code out of the cache and away from ads

**Files:**
- Modify: `lib/offline/sw-routing.js`
- Test: `lib/offline/sw-routing.test.ts`
- Create: `lib/ads/ads-allowed.ts`
- Test: `lib/ads/ads-allowed.test.ts`
- Modify: `app/adsense.tsx`

**Interfaces:**
- Consumes: nothing from Tasks 1 and 2. The path `/auth/action/` is written here as its own literal, because
  `lib/offline/sw-routing.js` is plain JavaScript the worker loads with `importScripts` and can't import TypeScript.
- Produces:

```ts
// lib/ads/ads-allowed.ts
/** False for pages whose URL can carry a one-time code (`/auth/action`, with or without its trailing slash). */
export function adsAllowedOn(pathname: string): boolean;
```

`app/adsense.tsx` becomes a client component that reads `usePathname()` and renders no script where `adsAllowedOn`
is false. It still renders nothing outside production or without `pId`.

**Spec:** none

**Tags:** `security`

**Knowledge:** (written by the end-of-plan knowledge job)
- `security/data-protection`: Firebase's one-time codes reach `/auth/action/` in the URL, so the service worker
  bypasses that path and AdSense isn't loaded there.
- `operations/service-worker`: `/auth/action` is bypassed like Firebase's reserved paths.

**Acceptance:**
- `cacheStrategy` gives `"bypass"` for `/auth/action/`, `/auth/action`, `/auth/action/?mode=resetPassword&oobCode=abc` and `/auth/action?mode=verifyEmail&oobCode=x`.
- `cacheStrategy` still gives `"network-first-page"` for `/auth/`, `/auth/actions/` and `/sign-in/` (the rule matches the path exactly, not as a prefix of a longer segment), and every existing case is unchanged.
- `adsAllowedOn("/auth/action/")` and `adsAllowedOn("/auth/action")` are false; `adsAllowedOn("/")`, `adsAllowedOn("/groups/")`, `adsAllowedOn("/sign-in/")` and `adsAllowedOn("/auth/actions/")` are true.

- [ ] **Step 1: Write the failing tests** for each Acceptance case in `lib/offline/sw-routing.test.ts` and `lib/ads/ads-allowed.test.ts`

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run lib/offline/sw-routing.test.ts lib/ads/ads-allowed.test.ts`
Expected: FAIL on the assertions. Create `lib/ads/ads-allowed.ts` with its real export first

- [ ] **Step 3: Write the minimal implementation**: the bypass in `cacheStrategy`, `adsAllowedOn`, and `app/adsense.tsx` reading the path

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run lib/offline/sw-routing.test.ts lib/ads/ads-allowed.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/offline/sw-routing.js lib/offline/sw-routing.test.ts lib/ads/ads-allowed.ts lib/ads/ads-allowed.test.ts app/adsense.tsx
git commit -m "Keep Firebase's one-time codes out of the service worker's cache and away from the ad script on /auth/action/."
```

### Task 4: A privacy policy link on the sign-in and sign-up screens

Added on 2026-11-05 at the developer's request during the run.

**Files:**
- Modify: `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- Modify: `app/(platform)/(auth)/sign-up/sign-up-form.tsx`

**Interfaces:**
- Consumes: the existing `/privacy/` page (`app/(platform)/privacy/page.hosting.tsx`) and `next/link`.
- Produces: nothing other tasks use.

The link is a plain "Privacy policy" link, the last line of each form, in the same small muted style as the links
above it (`text-muted-foreground underline-offset-4 hover:underline`). It doesn't say the person agrees to anything:
a consent line ("By creating an account, you agree to…") is the developer's decision, and none is recorded.

**Spec:** none

**Tags:** `screen`, `security`

**Knowledge:** none of its own. The end-of-plan knowledge job writes the fact into the sign-in feature concept beside
Task 2's change to it: the sign-in and sign-up screens link to the privacy policy at `/privacy/`.

**Acceptance:**
- The sign-in screen's last line is a "Privacy policy" link to `/privacy/`, below "New to Splitify? Sign up".
- The sign-up screen's last line is a "Privacy policy" link to `/privacy/`, below "Already have an account? Sign in".
- The link opens in the same tab, carries no `next` query, and works offline the way the other links do (it is a
  plain link, never disabled).
- `pnpm build` passes, and `out/sign-in/index.html` and `out/sign-up/index.html` each contain `href="/privacy/"`.

- [ ] **Step 1: Add the link to both forms**

- [ ] **Step 2: Build and check both pages carry the link**

Run: `pnpm build`
Expected: the build passes, and `grep -c 'href="/privacy/"' out/sign-in/index.html out/sign-up/index.html` counts at least 1 in each

- [ ] **Step 3: Commit**

```bash
git add "app/(platform)/(auth)/sign-in/sign-in-form.tsx" "app/(platform)/(auth)/sign-up/sign-up-form.tsx"
git commit -m "Link the privacy policy from the sign-in and sign-up screens."
```

## After the merge (the developer, outside the code)

Firebase console → Authentication → Templates → any template → edit the action URL to
`https://splitify.spanion.in/auth/action/`. The setting covers every template, and the API refuses it
(`knowledge/operations/deploy-setup.md`). Until it changes, the emails keep opening Firebase's own page, which still
works. The knowledge job records the step in `operations/deploy-setup`.
