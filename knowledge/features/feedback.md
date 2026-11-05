---
type: Feature
title: Feedback
description: A signed-in person can send one piece of feedback, a title and a description.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Feedback

## What it does

A form with a title and description, saved as a `Feedback` row against the caller.

## Screens and routes

- `app/(platform)/(app)/(forms)/feedback/add/page.tsx` with `form.tsx`, calling `useSendFeedback` (`lib/data/feedback.ts`) over [SQL Connect](../data/sql-connect.md).

## Rules

- `Feedback.userId` is unique, so a second submission from the same person fails with "Failed to create feedback".

## History

- 2026-11-05: called the `createFeedback` action; now `useSendFeedback`, because spec 2b moved the screen.

## Sources

- `app/(platform)/(app)/(forms)/feedback/add/page.tsx`
- `app/(platform)/(app)/(forms)/feedback/add/form.tsx`
- `actions/create-feedback/index.ts`
- `prisma/schema.prisma`
- `lib/data/feedback.ts`
