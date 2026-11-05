---
type: Feature
title: Feedback
description: A signed-in person can send one piece of feedback, a title and a description.
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
verified: human:ankitp@geekyants.com
---

# Feedback

## What it does

A form with a title and description, saved as a `Feedback` row against the caller.

## Screens and routes

- `app/(platform)/(app)/(forms)/feedback/add/page.tsx` with `form.tsx`, calling `useSendFeedback` (`lib/data/feedback.ts`) over [SQL Connect](../data/sql-connect.md).

## Rules

- A person has at most one `Feedback` row (its key is the user): a second submission replaces the first
  (`UpsertMyFeedback` in `dataconnect/app/activity.gql`).

## History

- 2026-11-05: said a second submission fails with "Failed to create feedback"; now it replaces the first, because the SQL Connect mutation upserts.
- 2026-11-05: called the `createFeedback` action; now `useSendFeedback`, because spec 2b moved the screen.

## Sources

- `app/(platform)/(app)/(forms)/feedback/add/page.tsx`
- `app/(platform)/(app)/(forms)/feedback/add/form.tsx`
- `dataconnect/app/activity.gql`
- `lib/data/feedback.ts`
