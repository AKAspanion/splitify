---
type: Finding
title: "Fixed: the /auth/action/ page's header had no back link"
description: The action page rendered the shared Header with a title only, so a person who arrived from an email had no link out of the page except the buttons its states offered; the header now links back to /.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# Fixed: the /auth/action/ page's header had no back link

## Finding

`ActionHandler` rendered `<Header title={titleFor(link)} />` with no back link. A person who reached the page from an
email had no way out except the buttons a given state offered.

## Evidence

- Ledger: "Final review: minor (deferred): the action page's header has no back link" (raised in the final review's
  deferred Minors; no numbered entry in the review files).
- `app/(platform)/(auth)/auth/action/action-handler.tsx` rendered the header with a title only, at d7ad71f.

## Status

Fixed. The header is `<Header title={titleFor(link)} backTo="/" />`, which links home, and `/` redirects by sign-in
state ([sign in](../features/sign-in.md), [decision](../decisions/remove-landing-page.md)).

## History

- 2026-11-06: was open; now fixed, because the auth-screens-and-bug-fixes plan added the back link.

## Sources

- `app/(platform)/(auth)/auth/action/action-handler.tsx`
