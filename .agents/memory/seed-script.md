---
name: Seed script dependency
description: The scripts package needs drizzle-orm as a direct dep for tsx to resolve it
---

When running seed scripts from `@workspace/scripts` with tsx, `drizzle-orm` must be listed as a **direct** dependency in `scripts/package.json`, even though `@workspace/db` (a dependency) already uses it internally.

tsx cannot resolve transitive workspace dependencies via package re-exports alone.

**Fix:** Add `"drizzle-orm": "catalog:"` to scripts/package.json dependencies, then re-run `pnpm install --no-frozen-lockfile`.

**Why:** pnpm strict isolation — each package only gets its declared dependencies on the resolution path.
