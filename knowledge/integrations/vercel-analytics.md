---
type: Integration
title: Vercel Analytics and Speed Insights
description: Page analytics and performance metrics from Vercel, loaded in production only.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Vercel Analytics and Speed Insights

## What it is used for

`app/analytics.tsx` renders Vercel's `Analytics` and `SpeedInsights` components when `NODE_ENV` is `production`; the
root layout mounts it.

## Configuration

None in the code: both report to the Vercel project the app is deployed to.

## Failure modes

Neither affects the app if it fails to load.

## Sources

- `app/analytics.tsx`
- `app/layout.tsx`
