---
type: Finding
title: A privacy page that loaded the ad script keeps it if the visitor signs in from another tab
description: app/adsense.tsx renders the ad script only while Auth reports signed-out, but a /privacy/ document that already loaded it keeps it running if the visitor signs in from another tab.
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-06T09:00:00Z
---

# A privacy page that loaded the ad script keeps it if the visitor signs in from another tab

## Finding

The ad script loads only for signed-out visitors, and public pages reach the app and sign-in screens by full page
loads, so it never carries into them ([AdSense](../integrations/google-adsense.md),
[decision](../decisions/adsense-on-public-pages-only.md)). A `/privacy/` document that loaded the script stays loaded
if the visitor signs in from another tab, because removing a loaded script doesn't stop it and nothing reloads the
page. The signed-in session then has the ad script on that one document until it is closed or reloaded.

## Evidence

Reported by the web fix wave of the repository-modernization run and deferred as Minor in its ledger.

## Status

Open.

## Sources

- `app/adsense.tsx`
