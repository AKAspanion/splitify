---
type: Project Overview
title: Splitify
description: An app for splitting shared expenses in groups: one Next.js web app, wrapped as Android and iOS apps.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Splitify

## Purpose

Splitify helps people share costs. Its tagline, in `config/site.ts`, is "Simplify and manage splits, the easy way!".
People sign in, create **groups** (a trip, a home, a couple, a project, an event), add **friends** or offline
**contacts**, record **expenses** that one or more people paid and that are split equally, exactly or by percent,
see who owes whom, and **settle up**. Members get push notifications and an activity feed of what changed.
Amounts are shown in rupees.

## Applications

- [The web app](../apps/splitify.md): the whole product, a Next.js app at the repository root.
- [Android](../apps/android.md): a Trusted Web Activity that opens the deployed web app.
- [iOS](../apps/ios.md): a WebView wrapper around the deployed web app, with push notifications.

How the parts fit is in [Architecture](architecture.md); how code is written is in
[Conventions](conventions.md).

## Open

- The access-control gaps in [findings](../findings/index.md) and the questions in
  [questions](../questions/index.md) are what a newcomer should read next.

## Sources

- `config/site.ts`
- `app/layout.tsx`
- `packages/android/source/app/build.gradle`
- `packages/ios/src/Splitify/Settings.swift`
