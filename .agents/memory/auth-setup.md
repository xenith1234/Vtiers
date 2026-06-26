---
name: Auth setup
description: How auth works in VERSUS TIERS — token type, storage, password hashing, and API client injection
---

Auth is HMAC-SHA256 token (payload.signature), NOT a JWT library. Token stored in localStorage as `vt_token`.

Password hashing: SHA256 with static salt `vt_salt_2024` (no bcrypt — not installed in this environment).

Token injection: `setAuthTokenGetter(() => localStorage.getItem("vt_token"))` called in `main.tsx` before app renders. Also called after login/logout in `auth-context.tsx`.

**Why:** bcrypt requires native bindings that aren't reliably available. SHA256+salt is sufficient for this use case.

**How to apply:** If you ever want stronger hashing, install bcryptjs (pure JS) — do NOT install bcrypt (native).
