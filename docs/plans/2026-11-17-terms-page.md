# Terms of Service Page Implementation Plan

**Status:** complete, commits ad646de..89b0a14, 2026-11-18. Record: [2026-11-17-terms-page.record.md](2026-11-17-terms-page.record.md)

> **For agentic workers:** REQUIRED SUB-SKILL: the project's workflow policy names the executor (`run.executor`): ga:feature-build-team by default, or ga:feature-build. Follow the policy and this plan's Checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public Terms of Service page at `/terms`, beside the existing public `/privacy` page, and link it everywhere the privacy policy is linked.

**Architecture:** `/terms` is a static page in `app/(platform)/terms/`, outside the signed-in `(app)` route group, exactly like `app/(platform)/privacy/`: a `page.tsx` with the content, a `page.hosting.tsx` that re-exports it (only `*.hosting.tsx` files are routes), and a render test beside it. The hosting build check and the service worker's static page list learn the new page. The sign-in and sign-up footers, and the privacy and delete-account pages, link to it with plain anchors.

**Tech Stack:** Next.js 16 static export on Firebase Hosting, React, Tailwind, Vitest (`pnpm test`), `pnpm check:hosting` for the hosting build.

**Spec:** none: a single public content page that mirrors the privacy page; the developer's request is the requirement.

## Global Constraints

- `/terms` loads no ad script: `app/adsense.tsx` stays mounted by `/privacy` and `/delete-account` only ([decision](../../knowledge/decisions/adsense-on-privacy-and-delete-account-pages.md)).
- Every link from a page that loads ads, and every link to one, is a plain `<a>` (a full page load), never `next/link`, so the ad script never runs beside the sign-in screens or the app.
- Contact address is `panditankit1995@gmail.com`, as on `/privacy`.
- Minimum age is 13, as on `/privacy`.
- Effective date: 17 November 2026.
- No governing-law or jurisdiction clause, and no operator legal name: neither is recorded anywhere, so the page doesn't invent one.

## Checkpoints

None (`run.checkpoints: none`).

---

### Task 1: The /terms page

**Files:**
- Create: `app/(platform)/terms/page.tsx`
- Create: `app/(platform)/terms/page.hosting.tsx`
- Test: `app/(platform)/terms/page.test.tsx`
- Modify: `scripts/hosting-pages/public.json`
- Modify: `lib/offline/sw-routing.js`
- Modify: `public/sw-routing.js`
- Modify: `lib/offline/sw-routing.test.ts`

**Interfaces:**
- Consumes: existing `Header` from `components/container/header.tsx` (`backTo`, `title`, `fullPageLoad`).
- Produces: the route `/terms` (trailing-slash form `/terms/`), whose page heading is "Terms of Service".

```ts
// app/(platform)/terms/page.tsx
declare const TermsPage: () => JSX.Element;
export default TermsPage;
// app/(platform)/terms/page.hosting.tsx re-exports it, as privacy's does.
```

The page follows `app/(platform)/privacy/page.tsx`'s layout (the same local `Section` component, the same `article`
classes), without `<Adsense />`. `Header` gets `backTo="/"`, `title="Terms of Service"` and `fullPageLoad`. Sections,
in order:

1. **Agreeing to these terms**: using Splitify (web at splitify.spanion.in, Android and iOS apps) means agreeing to these terms and the privacy policy (plain `<a href="/privacy/">`).
2. **What Splitify does**: it records shared expenses and who owes whom. It does not move, hold or send money; settling up happens outside the app.
3. **Your account**: you need to be 13 or older; keep your account secure; you are responsible for what happens under your account.
4. **What you enter**: you own the content you enter; members of a group see what you enter in it; you let Splitify store it and show it to them so the app works; enter only what you have the right to share, including contacts' names and email addresses.
5. **Acceptable use**: no unlawful use, no abuse or harassment of other members, no attempt to break, overload or get around the app's security, no access to other people's data.
6. **Advertising**: the public pages show ads from Google AdSense, as the privacy policy describes.
7. **Availability and changes**: provided "as is" and "as available", may change or stop features; no guarantee it is error-free or always available; check balances before settling.
8. **Limitation of liability**: to the extent the law allows, Splitify is not liable for indirect or consequential losses, or for amounts recorded wrongly.
9. **Ending your account**: you can delete your account at any time (plain `<a href="/delete-account/">`); Splitify may suspend an account that breaks these terms.
10. **Changes to these terms**: changes update the effective date; continuing to use Splitify means accepting them.
11. **Contact**: `mailto:panditankit1995@gmail.com`.

`scripts/hosting-pages/public.json` adds `"terms/index.html"` to `pages` and `{ "path": "/terms", "expectText": "Terms of Service" }` to `requests`.
Both `sw-routing.js` copies (they are identical; `public/` is the one `next dev` serves) add `"/terms/"` to `STATIC_PAGES`, after `"/privacy/"`.

**Spec:** none

**Tags:** `screen`, not security: static legal text with no data, no session and no form

**Knowledge:** `apps/splitify: /terms is a public page that loads no ads, built in the hosting build and listed in the hosting check and the service worker's static pages`; `decisions/adsense-on-privacy-and-delete-account-pages: /terms is public but carries no ads; links to and from the ad pages stay plain anchors`

**Acceptance:**
- Given the terms page renders, then it contains "Terms of Service" and "Effective date: 17 November 2026".
- Given the terms page renders, then its back link goes to `/` by a full page load (`fullPageLoad` set).
- Given the terms page renders, then it does not render the AdSense component.
- Given the terms page renders, then it links to the privacy policy with a plain anchor `href="/privacy/"` and to account deletion with `href="/delete-account/"`.
- Given the terms page renders, then it says Splitify does not move, hold or send money, and that users must be 13 or older.
- Given the terms page renders, then it contains `mailto:panditankit1995@gmail.com`.
- Given the service worker routing, when `cacheStrategy` is asked about `/terms/`, then it answers `network-first-page` (add `/terms/` to the existing `it.each` list in `lib/offline/sw-routing.test.ts`; add that file to the commit).

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `app/(platform)/terms/page.test.tsx` (mock `@/app/adsense` and `Header` the way `app/(platform)/privacy/page.test.tsx` does) and the `/terms/` entry in `lib/offline/sw-routing.test.ts`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run "app/(platform)/terms/page.test.tsx" lib/offline/sw-routing.test.ts`
Expected: FAIL on the assertions. Create `page.tsx` with an empty default export first, so the tests fail on behaviour, not on a missing module.

- [x] **Step 3: Write the page, the hosting wrapper, the manifest entries and the service-worker entry** until they pass

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run "app/(platform)/terms/page.test.tsx" lib/offline/sw-routing.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/terms/page.tsx" "app/(platform)/terms/page.hosting.tsx" "app/(platform)/terms/page.test.tsx" scripts/hosting-pages/public.json lib/offline/sw-routing.js public/sw-routing.js lib/offline/sw-routing.test.ts
git commit -m "Add a public Terms of Service page at /terms"
```

### Task 2: Link the terms beside the privacy policy

**Files:**
- Modify: `app/(platform)/(auth)/sign-in/sign-in-form.tsx`
- Modify: `app/(platform)/(auth)/sign-up/sign-up-form.tsx`
- Modify: `app/(platform)/privacy/page.tsx`
- Modify: `app/(platform)/delete-account/page.tsx`
- Test: `app/(platform)/privacy/page.test.tsx`

**Interfaces:**
- Consumes: nothing; it links to the path `/terms/` as a string, and builds and tests without Task 1's files.
- Produces: nothing other tasks use.

The sign-in and sign-up footers get a "Terms of service" plain `<a href="/terms/">` next to the existing "Privacy
policy" anchor, with the same classes, the two on one line separated by a middle dot. The privacy page's opening
"Who we are" section gets a sentence linking "Terms of Service" (`<a className="underline" href="/terms/">`), and the
delete-account page links it next to its existing privacy link.

**Spec:** none

**Tags:** `screen`, `security` (it edits the sign-in and sign-up screens, though only their footers)

**Knowledge:** `features/sign-in: the sign-in and sign-up footers link "Privacy policy" and "Terms of service" with plain anchors`

**Acceptance:**
- Given the privacy page renders, then it contains `<a class="underline" href="/terms/">`.
- Given the delete-account page renders, then it contains `<a class="underline" href="/terms/">` and still contains `<a class="underline" href="/privacy">`.
- Given the existing privacy-page tests, then they all still pass unchanged.

- [x] **Step 1: Write the failing tests** for each Acceptance case, in `app/(platform)/privacy/page.test.tsx`

- [x] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run "app/(platform)/privacy/page.test.tsx"`
Expected: FAIL on the two new assertions

- [x] **Step 3: Add the links** to the four files

- [x] **Step 4: Run them to verify they pass**

Run: `pnpm vitest run "app/(platform)/privacy/page.test.tsx"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add "app/(platform)/(auth)/sign-in/sign-in-form.tsx" "app/(platform)/(auth)/sign-up/sign-up-form.tsx" "app/(platform)/privacy/page.tsx" "app/(platform)/delete-account/page.tsx" "app/(platform)/privacy/page.test.tsx"
git commit -m "Link the terms of service beside the privacy policy"
```
