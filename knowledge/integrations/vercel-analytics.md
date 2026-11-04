---
type: Integration
title: Vercel Analytics and Speed Insights
description: Page analytics and performance metrics from Vercel, loaded in production only, except in the hosting build.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Vercel Analytics and Speed Insights

## What it is used for

`app/analytics.tsx` renders Vercel's `Analytics` and `SpeedInsights` components when `NODE_ENV` is `production` and the build isn't the hosting build (`NEXT_BUILD_TARGET=hosting`, where
`/_vercel/insights` doesn't exist); the root layout mounts it.

## Configuration

None in the code: both report to the Vercel project the app is deployed to.

## Failure modes

Neither affects the app if it fails to load.

## History

- 2026-11-05: rendered in every production build; now not in the hosting build, because Firebase Hosting has no Vercel insights endpoint.

## Sources

- `app/analytics.tsx`
- `app/layout.tsx`
