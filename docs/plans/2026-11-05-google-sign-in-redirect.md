# Google Sign-in by Redirect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:feature-build-team by default, or ga:feature-build. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

Plan, then build; tests with each task. Say 'test-first' or 'spec it first' to work that way.

**Goal:** Google sign-in leaves the page for Google and comes back (a redirect, not a popup), and the Firebase auth domain is `splitify.spanion.in`, so Google's screen says "Sign in to splitify.spanion.in".

**Architecture:** `lib/firebase/auth.ts` starts the redirect with `signInWithRedirect` and leaves a per-tab marker in `sessionStorage`; when the page loads back, the sign-in and sign-up forms call `completeGoogleSignIn()`, which reads `getRedirectResult` and runs `UpsertMe` before the form navigates to `next`. The auth domain is the build's `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`; Firebase Hosting already serves `/__/auth/handler` and `/__/firebase/init.json` on `splitify.spanion.in`, so the redirect stays on the site's own domain and needs no third-party storage.

**Tech Stack:** Next.js 16 (static export on Firebase Hosting), Firebase Auth JS SDK (`firebase/auth`), SQL Connect generated SDK (`@dataconnect/app`), Vitest; GitHub Actions builds hosting from repository Variables.

**Spec:** none: an everyday change the developer asked for in chat ("change the login from popup to redirect", "update the domain here to splitify.spanion.in").

## Global Constraints

- The auth domain is `splitify.spanion.in`, the hosted site's own domain.
- `UpsertMe` runs once for every completed Google sign-in, before the form navigates ([features/sign-in](../../knowledge/features/sign-in.md)).
- After sign-in the person goes to `safeNextPath(next)`, as today; the redirect returns to the same URL, so `next` survives it.
- Errors stay the app's own words through `authErrorMessage`, never Firebase's message.
- Local development keeps the emulators' `demo-splitify.firebaseapp.com` (`scripts/dev-env.mjs`); this plan doesn't change it.

## Checkpoints

None (`run.checkpoints: none`, the fast pace).

## Outside the code (the developer, before the hosting deploy)

These aren't tasks: an agent can't make them. The finish lists them again.

1. Google Cloud console → APIs & Services → Credentials → the Web client "auto created by Google Service": add `https://splitify.spanion.in/__/auth/handler` to Authorized redirect URIs and `https://splitify.spanion.in` to Authorized JavaScript origins. Without it Google answers `redirect_uri_mismatch`.
2. GitHub repository Variable `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` set to `splitify.spanion.in` (the deploy workflow bakes it into the build). With the developer's yes, `gh variable set` does it.

---

### Task 1: Google sign-in by redirect, and the auth domain

**Files:**
- Modify: `lib/firebase/auth.ts`
- Modify: `lib/firebase/app.ts` (the `authDomain` fallback)
- Modify: `.env.sample` (`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`)
- Test: `lib/firebase/google-redirect.test.ts`

**Interfaces:**
- Consumes: existing `upsertCurrentUser()` (private, `lib/firebase/auth.ts`), existing `getFirebaseAuth()` (`lib/firebase/app.ts`)
- Produces (Task 2 relies on these):

```ts
/** Leaves the page for Google's sign-in. Sets the redirect marker first; resolves only if the redirect fails to start. */
export function signInWithGoogle(): Promise<void>;
/** True while a Google redirect this tab started hasn't been completed. False where there is no sessionStorage. */
export function googleRedirectPending(): boolean;
/**
 * After the page loads back from Google: when the marker is set, reads the redirect result, runs UpsertMe for the
 * signed-in person and clears the marker. Resolves true when a Google sign-in completed, false when none was in
 * flight or the person came back without signing in. Rejects with Firebase's error, marker cleared.
 */
export function completeGoogleSignIn(): Promise<boolean>;
```

The marker is the `sessionStorage` key `splitify:google-redirect`: per tab, and it survives the round trip to Google.

**Spec:** none

**Tags:** security, failure-paths

**Knowledge:** `features/sign-in: Google sign-in is a redirect; a sessionStorage marker tells the form a redirect is coming back, and completeGoogleSignIn runs UpsertMe before it navigates`; `operations/deploy-setup: the auth domain is splitify.spanion.in, which needs the OAuth client's redirect URI and the NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN Variable`; `operations/environment: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is splitify.spanion.in in production`.

**Acceptance:**
- Given no marker, when `signInWithGoogle()` is called, then the marker `splitify:google-redirect` is set before `signInWithRedirect` is called, with the app's Auth and a `GoogleAuthProvider`, and `signInWithPopup` is never called.
- Given `signInWithRedirect` rejects (`auth/network-request-failed`), when `signInWithGoogle()` is called, then the marker is cleared and the error is rethrown.
- Given no marker, when `completeGoogleSignIn()` is called, then it resolves `false`, and neither `getRedirectResult` nor `UpsertMe` is called.
- Given the marker and `getRedirectResult` resolving a credential, when `completeGoogleSignIn()` is called, then `UpsertMe` runs once, the marker is cleared, and it resolves `true`.
- Given the marker and `getRedirectResult` resolving `null` (the person came back from Google without signing in), when `completeGoogleSignIn()` is called, then `UpsertMe` doesn't run, the marker is cleared, and it resolves `false`.
- Given the marker and `getRedirectResult` rejecting (`auth/account-exists-with-different-credential`), when `completeGoogleSignIn()` is called, then the marker is cleared and the error is rethrown, so the form can show `authErrorMessage`'s text.
- Given the marker and `UpsertMe` rejecting, when `completeGoogleSignIn()` is called, then the marker is cleared and the error is rethrown.
- Given no `sessionStorage` (Node), when `googleRedirectPending()` is called, then it returns `false` without throwing.
- Given `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` unset, when `getFirebaseApp()` builds the app, then its `authDomain` is `splitify.spanion.in`.

- [ ] **Step 1: Write the failing tests** for each Acceptance case in `lib/firebase/google-redirect.test.ts`, mocking `firebase/auth` and `@dataconnect/app` with `vi.mock`, and `sessionStorage` with `vi.stubGlobal`. Export the three functions with their real signatures first, so the tests fail on behaviour.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec vitest run lib/firebase/google-redirect.test.ts`
Expected: FAIL on the assertions.

- [ ] **Step 3: Write the minimal implementation** to the Interfaces in `lib/firebase/auth.ts`, change the `authDomain` fallback in `lib/firebase/app.ts` and the value in `.env.sample` to `splitify.spanion.in`, until the tests pass.

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm exec vitest run lib/firebase/google-redirect.test.ts lib/firebase/app.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/firebase/auth.ts lib/firebase/app.ts .env.sample lib/firebase/google-redirect.test.ts
git commit -m "Start Google sign-in as a redirect, finish it with UpsertMe when the page loads back, and use splitify.spanion.in as the auth domain."
```

### Task 2: The forms finish a Google redirect before they navigate

**Files:**
- Modify: `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- Modify: `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- Test: `lib/auth/google-return.test.ts`
- Create: `lib/auth/google-return.ts`

**Interfaces:**
- Consumes: `signInWithGoogle()`, `googleRedirectPending()`, `completeGoogleSignIn()` from Task 1; existing `authErrorMessage()` (`lib/auth/auth-errors.ts`), `safeNextPath()` (`lib/auth/next-path.ts`), `useAuth()` (`hooks/use-auth.ts`)
- Produces:

```ts
/** What a form does once the page loads: finish a Google redirect, if one is coming back. */
export type GoogleReturn =
  | { kind: "none" }
  | { kind: "signed-in" }
  | { kind: "failed"; message: string };
/** Runs completeGoogleSignIn and turns its outcome into the form's next step; never rejects. */
export function finishGoogleReturn(): Promise<GoogleReturn>;
```

Each form, on mount, sets `pending` to `"google"` when `googleRedirectPending()` is true (in an effect, never during render, since the page is prerendered), awaits `finishGoogleReturn()`, then navigates to `next` on `signed-in`, shows the message on `failed`, and clears `pending` on `none`. The existing effect that sends a signed-in person on to `next` already waits while `pending` is set, so it can't leave before `UpsertMe`. The Google button calls `signInWithGoogle()`; the page leaves, so the button stays loading.

**Spec:** none

**Tags:** security, failure-paths

**Knowledge:** `features/sign-in: the forms finish a Google redirect on load, show its error in the form, and go to next only after UpsertMe`.

**Acceptance:**
- Given `completeGoogleSignIn` resolves `true`, when `finishGoogleReturn()` runs, then it resolves `{ kind: "signed-in" }`.
- Given `completeGoogleSignIn` resolves `false`, when `finishGoogleReturn()` runs, then it resolves `{ kind: "none" }`.
- Given `completeGoogleSignIn` rejects with `auth/account-exists-with-different-credential`, when `finishGoogleReturn()` runs, then it resolves `{ kind: "failed", message: "Something went wrong. Try again." }` (the unmapped code's text from `authErrorMessage`), never Firebase's message.
- Given `completeGoogleSignIn` rejects with `auth/network-request-failed`, when `finishGoogleReturn()` runs, then it resolves `{ kind: "failed", message: "Couldn't reach Splitify. Check your connection." }`.
- Given the sign-in page at `/sign-in?next=//evil.example` loads back from Google signed in, when the form navigates, then it goes to `/groups` (manual check: `safeNextPath` already has its own tests).

- [ ] **Step 1: Write the failing tests** for the first four Acceptance cases in `lib/auth/google-return.test.ts`, mocking `@/lib/firebase/auth`. Create `lib/auth/google-return.ts` exporting `finishGoogleReturn` with its real signature first.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec vitest run lib/auth/google-return.test.ts`
Expected: FAIL on the assertions.

- [ ] **Step 3: Write the minimal implementation** of `finishGoogleReturn`, then wire both forms to it as the Interfaces describe.

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm exec vitest run lib/auth/google-return.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/auth/google-return.ts lib/auth/google-return.test.ts "app/(platform)/(auth)/sign-in/sign-in-form.tsx" "app/(platform)/(auth)/sign-up/sign-up-form.tsx"
git commit -m "Finish a Google redirect when the sign-in or sign-up form loads, and go on only after UpsertMe."
```
