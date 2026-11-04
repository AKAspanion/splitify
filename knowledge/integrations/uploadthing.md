---
type: Integration
title: UploadThing
description: An image-upload route for signed-in users, up to 4MB per image, with React helpers in components/uploadthing.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# UploadThing

## What it is used for

`app/api/uploadthing/core.ts` defines one file route, `imageUploader`: images up to `4MB`, signed-in users only
(its middleware throws `Unauthorized` without `auth().userId`). `app/api/uploadthing/route.ts` serves it, and
`components/uploadthing/` holds the button, uploader and `useUploadThing` helpers. No page imports
`components/uploadthing/` (group images are placeholders: see [groups](../features/groups.md)).

## Configuration

`UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` ([environment](../operations/environment.md)). `/api/uploadthing` is a
public route in `middleware.ts`; the file route checks the session itself.

## Failure modes

An upload by someone signed out fails in the file route's middleware with `UploadThingError("Unauthorized")`.

## Sources

- `app/api/uploadthing/core.ts`
- `app/api/uploadthing/route.ts`
- `components/uploadthing/uploadthing.ts`
- `components/uploadthing/button.tsx`
- `components/uploadthing/uploader.tsx`
- `middleware.ts`
