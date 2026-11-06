# Verify-email banner and two console errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:feature-build-team by default, or ga:feature-build. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

Plan, then build; tests with each task. Say 'test-first' or 'spec it first' to work that way.

**Goal:** Show the verify-email banner on Groups (dismissable, back 7 days after a dismiss) and always on Profile, with a Dismiss button instead of "I've verified"; and fix the nested button in every dialog and the state update during render on the email-link page.

**Architecture:** The banner leaves the signed-in layout and is mounted by the two screens that keep it, with a `dismissable` prop; the last dismissal date is kept per person in `localStorage`. The dialog's close control renders one button. The email-link page cleans the address bar outside React's render.

**Tech Stack:** Next.js 16 static export, React, Firebase Auth (`useAuth`, `sendVerificationEmail`), shadcn/Radix dialog, Vitest, Playwright (`tests/e2e/`), pnpm.

**Spec:** none: a small change settled by the developer's answers on 2026-11-06 (Groups and Profile only; no re-check on focus, the banner clears on the next sign-in or token refresh as it does today; no Dismiss on Profile; dismissal dates in localStorage; 7 days).

## Global Constraints

- House rules are `knowledge/project/conventions.md`.
- Every `localStorage` read and write is wrapped so a blocked or full storage never throws into the page; with storage unavailable the banner shows.
- Copy is plain sentences in the app's own words.
- Run each test alone by name; no task runs the whole suite.

## Checkpoints

None (`run.checkpoints: none`).

## Review Focus

- A dismissal stored for one person must not hide the banner for another person signed in on the same device.
- A stored value that isn't a date (edited, corrupted) must show the banner, not hide it forever.
- A clock set back after a dismissal must not hide the banner for more than 7 days from now.
- The email-link page must still remove the one-time code from the address bar before anything else can read it, and still read the link once per document.

---

### Task 1: Verify-email banner on Groups and Profile

**Files:**
- Create: `lib/auth/verify-banner-dismissal.ts`
- Create: `lib/auth/verify-banner-dismissal.test.ts`
- Modify: `components/auth/verify-email-banner.tsx`
- Create: `components/auth/verify-email-banner.test.tsx`
- Modify: `app/(platform)/(app)/layout.hosting.tsx`
- Modify: `app/(platform)/(app)/(screens)/groups/page.tsx`
- Modify: `app/(platform)/profile/page.tsx`
- Create: `tests/e2e/verify-banner.spec.ts`

**Interfaces:**
- Consumes: existing `useAuth()`, `sendVerificationEmail()` (`lib/firebase/auth.ts`).
- Produces:

```ts
export const VERIFY_BANNER_SNOOZE_DAYS = 7;
export function verifyBannerKey(uid: string): string; // "splitify:verify-banner-dismissed:<uid>"
export function isVerifyBannerSnoozed(stored: string | null, now: Date): boolean;
export function readVerifyBannerDismissal(uid: string): string | null;
export function writeVerifyBannerDismissal(uid: string, now: Date): void;
export function VerifyEmailBanner(props: { dismissable?: boolean }): JSX.Element | null;
```

**Spec:** none

**Tags:** `screen`, `failure-paths`, `security`

**Knowledge:** `features/sign-in: the verify-email banner shows on Groups until dismissed, again 7 days after a dismiss, and always on Profile; it has Resend email and, on Groups, Dismiss; it clears on the next token refresh or sign-in once verified`, `decisions/verify-banner-placement: banner on Groups (dismissable, 7-day snooze per person in localStorage) and always on Profile, no re-check on focus, as the developer chose on 2026-11-06`

**Acceptance:**
- Given no stored dismissal, when `isVerifyBannerSnoozed(null, now)` runs, then it is `false`.
- Given a dismissal 6 days 23 hours ago, then it is `true`; given exactly 7 days ago or more, then it is `false`.
- Given a stored value that isn't an ISO date, then it is `false`.
- Given a stored date in the future (clock moved back), then it is `true` only while that date is less than 7 days ahead of now; one more than 7 days ahead is `false`.
- Given `localStorage` throws on read or write, then reading returns `null`, writing does nothing, and neither throws.
- Given two people on one device, then a dismissal written for one uid leaves the other's key empty.
- Given an unverified person on Groups with no dismissal, then the banner shows the text "Verify your email to keep your account safe. Contacts others added with this email join your account once you do." with "Resend email" and "Dismiss", and no "I've verified".
- Given Dismiss is pressed, then the banner hides at once and the person's key holds today's date; after a reload on Groups it stays hidden.
- Given an unverified person on Profile, then the banner shows with "Resend email" and no "Dismiss", whatever the stored date.
- Given a verified person, or a signed-out one, then no banner renders on either screen.
- Given Activity, Friends or a form screen, then no banner renders.
- Given Resend email fails, then its error shows under the banner and Resend is enabled again (existing behaviour kept).
- e2e: `tests/e2e/verify-banner.spec.ts` signs in an unverified test user, sees the banner on `/groups/`, presses Dismiss, reloads and sees none, then opens `/profile/` and sees the banner with no Dismiss.

- [ ] **Step 1: Write the failing tests** for each Acceptance case, in `lib/auth/verify-banner-dismissal.test.ts`, `components/auth/verify-email-banner.test.tsx` and `tests/e2e/verify-banner.spec.ts`

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run lib/auth/verify-banner-dismissal.test.ts components/auth/verify-email-banner.test.tsx`
Expected: FAIL on the assertions.

- [ ] **Step 3: Write the minimal implementation:** the dismissal module, the banner's `dismissable` prop and Dismiss button, the banner out of the layout and into Groups (`dismissable`) and Profile

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run lib/auth/verify-banner-dismissal.test.ts components/auth/verify-email-banner.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/auth/verify-banner-dismissal.ts lib/auth/verify-banner-dismissal.test.ts components/auth/verify-email-banner.tsx components/auth/verify-email-banner.test.tsx "app/(platform)/(app)/layout.hosting.tsx" "app/(platform)/(app)/(screens)/groups/page.tsx" "app/(platform)/profile/page.tsx" tests/e2e/verify-banner.spec.ts
git commit -m "Show the verify-email banner on Groups until dismissed for 7 days and always on Profile, with Dismiss instead of I've verified."
```

### Task 2: One button in the dialog's close control, no state update during the action page's render

**Files:**
- Modify: `components/ui/dialog.tsx`
- Modify: `app/(platform)/(auth)/auth/action/action-handler.tsx`
- Test: `app/(platform)/(auth)/auth/action/action-handler.test.ts`
- Create: `components/ui/dialog.test.tsx`

**Interfaces:**
- Consumes: existing `openActionLink`, `readActionLinkOnce` (`action-handler.tsx`), existing `DialogContent`.
- Produces: `readActionLinkOnce(win)` keeps its signature and still returns the same link for every call in a document; the address-bar cleanup it triggers no longer runs inside a React render.

**Spec:** none

**Tags:** `security`, `screen`

**Knowledge:** `findings/action-page-updates-router-during-render: Fixed: the action page cleans the address bar outside React's render, still before the page paints`, `design-system/components: a dialog's close control is one button (Radix Close asChild)`

**Acceptance:**
- Given `DialogContent` with `closable`, when it renders, then its close control is a single `<button>` with the accessible name "Close" and no `<button>` inside it.
- Given `closable={false}`, then no close control renders.
- Given an email link, when `readActionLinkOnce` is called twice in one document, then both calls return the same link and `openActionLink` ran once.
- Given an email link, when the page renders, then `history.replaceState` is not called during the render, and has been called with `/auth/action/` before the next animation frame.
- Given the link is `firebase`-kind, then `location.replace` to its `forwardTo` still happens once.

- [ ] **Step 1: Write the failing tests** for each Acceptance case, in `components/ui/dialog.test.tsx` and `app/(platform)/(auth)/auth/action/action-handler.test.ts`

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run components/ui/dialog.test.tsx "app/(platform)/(auth)/auth/action/action-handler.test.ts"`
Expected: FAIL on the assertions.

- [ ] **Step 3: Write the minimal implementation** to the Interfaces

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run components/ui/dialog.test.tsx "app/(platform)/(auth)/auth/action/action-handler.test.ts"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/ui/dialog.tsx components/ui/dialog.test.tsx "app/(platform)/(auth)/auth/action/action-handler.tsx" "app/(platform)/(auth)/auth/action/action-handler.test.ts"
git commit -m "Render one button for a dialog's close control and clean the email link out of the address bar outside React's render."
```
