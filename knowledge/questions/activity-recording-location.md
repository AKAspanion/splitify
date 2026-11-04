---
type: Open Question
title: Why is activity recorded in the notification routes?
description: Activity rows are written by /api/push-notification routes the browser calls after each action, not by the actions. Is that intended?
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-04T07:18:08Z
---

# Why is activity recorded in the notification routes?

## Question

Should the `Activity` row for a change be written by the server action that makes the change, in the same
transaction, rather than by the push-notification route the browser calls afterwards?

## Why it matters

As written, the activity feed misses any change whose follow-up call fails, and the route trusts the actor in the
request body ([open push relay](../findings/push-notification-open-relay.md)). Nothing in the code or history says
why it was done this way.

## Status

Answered: yes; each server action writes its activity entry in the same transaction as its change, and sends
its pushes on the server. See [activity and notifications in actions](../decisions/activity-and-notifications-in-actions.md).

## Sources

- `lib/notification/service/index.ts`
- `app/api/push-notification/create-expense/route.ts`
- `actions/create-expense/index.ts`
