# Open findings fixes Implementation Plan

**Status:** complete, commits c59de44..7ef9f66, 2026-11-06; record: [2026-11-06-open-findings-fixes.record.md](2026-11-06-open-findings-fixes.record.md)

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:feature-build-team by default, or ga:feature-build. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

Plan, then build; tests with each task. Say 'test-first' or 'spec it first' to work that way.

**Goal:** Fix the four open findings recorded on 2026-11-06: revoked ID tokens accepted by the HTTP functions, a second delete call while the dialog closes, silent banner-storage failures, and a sign-out that can hang on push-token removal.

**Architecture:** Four independent one-file fixes, each with its test beside it: the functions' shared guard checks revocation, the delete action guards against a second run, the dismissal module logs its storage failures, and push-token removal gets a deadline.

**Tech Stack:** Next.js 16 static export, Firebase Auth (client and admin SDK), Cloud Functions v2, Vitest (root, and the rules config for `functions/`), pnpm.

**Spec:** none: each fix is stated by its finding concept (guard-accepts-revoked-id-tokens, delete-account-allows-second-submit-while-closing, verify-banner-storage-failures-are-silent, sign-out-can-hang-on-push-token-removal), which the developer asked to fix on 2026-11-06.

## Global Constraints

- House rules are `knowledge/project/conventions.md`: logs carry an error's class only, never its message ([logging](../../knowledge/operations/logging.md)).
- Run each test alone by name; no task runs the whole suite.

## Checkpoints

None (`run.checkpoints: none`).

## Review Focus

- A revoked or deleted account's request must get `401` "Sign in again to continue.", the same as an invalid token, with nothing else revealed.
- A delete that fails must still let the person try again (the guard must not stay set after a failure).
- A sign-out whose push removal times out must still sign out and must still drop the stored token.

---

### Task 1: The functions' guard refuses revoked ID tokens

**Files:**
- Modify: `functions/src/http/guard.ts`
- Test: `functions/src/http/guard.test.ts`

**Interfaces:**
- Consumes: existing `guard(req, res, opts)`.
- Produces: `guard` calls `verifyIdToken(token, true)` (revocation checked); signature unchanged.

**Spec:** none

**Tags:** `security`

**Knowledge:** `findings/guard-accepts-revoked-id-tokens: Fixed: guard checks revocation, so a token issued before deleteMyAccount revoked the refresh tokens is refused`

**Acceptance:**
- Given a token the admin SDK reports as revoked (`auth/id-token-revoked`), when a request arrives, then the guard answers `401` `{ message: "Sign in again to continue." }`, logs `guard: sign-in refused` with the cause class only, and doesn't read the body.
- Given a token whose user was deleted (`auth/user-not-found`) or disabled (`auth/user-disabled`), then the same `401`.
- Given a valid, unrevoked token, then the guard calls `verifyIdToken` with `checkRevoked` `true` and returns the uid and body as before.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `functions/src/http/guard.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm test:rules`
Expected: FAIL on the `checkRevoked` assertion.

- [x] **Step 3: Write the minimal implementation** to the Interfaces

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm test:rules`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add functions/src/http/guard.ts functions/src/http/guard.test.ts
git commit -m "Refuse revoked ID tokens in the functions' guard."
```

### Task 2: Delete account runs once per confirmation

**Files:**
- Modify: `app/(platform)/profile/delete-account-action.tsx`
- Create: `app/(platform)/profile/delete-account-action.test.tsx`

**Interfaces:**
- Consumes: existing `DeleteAccountDialog` (`onConfirm`), `deleteMyAccount`, `deleteAccountFailure`.
- Produces: `handleDelete` returns at once while a delete is in flight; the guard is released when the delete fails.

**Spec:** none

**Tags:** `security`, `failure-paths`

**Knowledge:** `findings/delete-account-allows-second-submit-while-closing: Fixed: a second confirm while a delete is in flight does nothing`

**Acceptance:**
- Given a delete in flight, when the dialog's confirm fires again, then `deleteMyAccount` has been called once.
- Given the delete fails with another error, then the toast shows its message once, the button is enabled again, and a later confirm calls `deleteMyAccount` again.
- Given the delete fails because the sign-in is too old, then the person is signed out and sent to `/sign-in/?next=/profile/` once (existing behaviour kept).

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `app/(platform)/profile/delete-account-action.test.tsx`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run "app/(platform)/profile/delete-account-action.test.tsx"`
Expected: FAIL on the call count.

- [x] **Step 3: Write the minimal implementation:** a ref set before the call and cleared on failure

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run "app/(platform)/profile/delete-account-action.test.tsx"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/profile/delete-account-action.tsx" "app/(platform)/profile/delete-account-action.test.tsx"
git commit -m "Run an account deletion once per confirmation."
```

### Task 3: Banner storage failures are logged

**Files:**
- Modify: `lib/auth/verify-banner-dismissal.ts`
- Test: `lib/auth/verify-banner-dismissal.test.ts`

**Interfaces:**
- Consumes: existing `readVerifyBannerDismissal`, `writeVerifyBannerDismissal`.
- Produces: unchanged signatures; each catch logs one `console.warn`.

**Spec:** none

**Tags:** `failure-paths`, `security`

**Knowledge:** `findings/verify-banner-storage-failures-are-silent: Fixed: a storage failure logs "[verify-banner] <read|write> failed" with the error's class`

**Acceptance:**
- Given `localStorage.getItem` throws a `SecurityError`, when the dismissal is read, then it returns `null` and logs exactly `console.warn("[verify-banner] read failed", "SecurityError")`, with no error message.
- Given `localStorage.setItem` throws a `QuotaExceededError`, when the dismissal is written, then nothing throws and it logs `console.warn("[verify-banner] write failed", "QuotaExceededError")`.
- Given storage works, then nothing is logged.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `lib/auth/verify-banner-dismissal.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run lib/auth/verify-banner-dismissal.test.ts`
Expected: FAIL on the log assertions.

- [x] **Step 3: Write the minimal implementation** to the Interfaces

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run lib/auth/verify-banner-dismissal.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add lib/auth/verify-banner-dismissal.ts lib/auth/verify-banner-dismissal.test.ts
git commit -m "Log the verify banner's storage failures by their class."
```

### Task 4: Sign-out doesn't wait forever on push-token removal

**Files:**
- Modify: `lib/push/register.ts`
- Test: `lib/push/register.test.ts`

**Interfaces:**
- Consumes: existing `unregisterThisDevice(deps)` and its `PushDeps`.
- Produces:

```ts
export const PUSH_REMOVAL_DEADLINE_MS = 5000;
```

`unregisterThisDevice` resolves within `PUSH_REMOVAL_DEADLINE_MS` whatever `remove` does; it still never rejects.

**Spec:** none

**Tags:** `security`, `failure-paths`

**Knowledge:** `findings/sign-out-can-hang-on-push-token-removal: Fixed: token removal gives up after 5 seconds, logs "token removal" with TimeoutError, drops the stored token and sign-out goes on`

**Acceptance:**
- Given `remove` never settles, when `unregisterThisDevice` runs, then it resolves after `PUSH_REMOVAL_DEADLINE_MS` (fake timers), logs the failure as `token removal` with the class `TimeoutError`, and removes the stored token.
- Given `remove` resolves in time, then it resolves at once, logs nothing and removes the stored token (existing behaviour).
- Given `remove` rejects, then it logs and removes the stored token (existing behaviour).
- Given no stored token, then `remove` isn't called.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `lib/push/register.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run lib/push/register.test.ts`
Expected: FAIL on the never-settling case.

- [x] **Step 3: Write the minimal implementation** to the Interfaces

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run lib/push/register.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add lib/push/register.ts lib/push/register.test.ts
git commit -m "Give push-token removal a 5-second deadline so sign-out never hangs on it."
```
