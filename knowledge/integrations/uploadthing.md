---
type: Integration
title: UploadThing (removed)
description: UploadThing is removed: no screen uploaded images, so its route and components went with the server.
status: draft
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# UploadThing (removed)

The `imageUploader` route, `/api/uploadthing` and `components/uploadthing/` are gone. No screen used them (group images are
placeholders: see [groups](../features/groups.md)), so the server's removal dropped UploadThing rather than moving it to a
function. Provisional: the developer confirms no upload is wanted; if one is, it needs a new design, such as Firebase
Storage. The UPLOADTHING_TOKEN key stays in `.env.sample` until the developer removes it
([environment](../operations/environment.md)).

## History

- 2026-11-05: was an image-upload route for signed-in users; now removed, because no screen used it and spec 2c removed the server. See [decision](../decisions/static-build-on-firebase-hosting.md).
- 2026-11-04: its keys were `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`; now `UPLOADTHING_TOKEN`, because uploadthing 7 replaced them. See [upgrade](../decisions/upgrade-all-dependencies.md).

## Sources

- `.env.sample`
