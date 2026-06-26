---
name: Express params TypeScript
description: Express 5 route params are typed as string | string[] — must cast before using
---

Express 5 types `req.params.id` as `string | string[]`, which breaks Drizzle's `parseInt()` calls.

**Fix:** Always wrap with `String()`: `parseInt(String(req.params.id))`.

**Why:** Express 5 made param types stricter. This affects all route files in api-server.
