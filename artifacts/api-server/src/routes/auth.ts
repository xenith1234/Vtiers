import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { signToken, requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "vt_salt_2024").digest("hex");
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: "Username, email, and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const existing = await db.select().from(usersTable)
      .where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const existingUsername = await db.select().from(usersTable)
      .where(eq(usersTable.username, username)).limit(1);
    if (existingUsername.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }
    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash: hashPassword(password),
      role: "member",
      status: "active",
    }).returning();
    const token = signToken(user.id);
    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt.toISOString() },
      token
    });
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.status !== "active") {
      res.status(401).json({ error: "Account suspended or banned" });
      return;
    }
    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));
    const token = signToken(user.id);
    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt.toISOString(), lastLogin: new Date().toISOString() },
      token
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString() ?? null
  });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  res.json({ message: "If that email exists, a reset link has been sent" });
});

export default router;
