---
type: Finding
title: The /auth/action/ page's header has no back link
description: The action page renders the shared Header with a title only, so a person who arrives from an email has no link out of the page except the buttons its states offer.
generated:
  by: agent:after-finish
  at: 2026-11-05T19:30:00Z
---

# The /auth/action/ page's header has no back link

## Finding

`ActionHandler` renders `<Header title={titleFor(link)} />` with no back link. A person who reaches the page from an
email has no way out except the buttons a given state offers.

## Evidence

- Ledger: "Final review: minor (deferred): the action page's header has no back link" (raised in the final review's
  deferred Minors; no numbered entry in the review files).
- `app/(platform)/(auth)/auth/action/action-handler.tsx:68` renders the header with a title only, at d7ad71f.

## Status

Open.

## Sources

- `app/(platform)/(auth)/auth/action/action-handler.tsx`
