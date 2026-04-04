import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { createHash } from "crypto";

const router: ReturnType<typeof Router> = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "proptech_salt").digest("hex");
}

const sessions = new Map<string, number>();

function generateToken(): string {
  return createHash("sha256").update(Math.random().toString() + Date.now().toString()).digest("hex");
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Account is disabled" });
    return;
  }

  const token = generateToken();
  sessions.set(token, user.id);

  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    sessions.delete(token);
  }
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = authHeader.slice(7);
  const userId = sessions.get(token);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { passwordHash: _ph, ...safeUser } = user;
  res.json(safeUser);
});

export { sessions, hashPassword };
export default router;
