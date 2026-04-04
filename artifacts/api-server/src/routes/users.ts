import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "./auth";

const router: ReturnType<typeof Router> = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const safe = users.map(({ passwordHash: _ph, ...u }) => u);
  res.json(safe);
});

router.post("/users", async (req, res): Promise<void> => {
  const { email, password, firstName, lastName, role, companyId } = req.body;
  if (!email || !password || !firstName || !lastName || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [user] = await db.insert(usersTable).values({
    email, passwordHash: hashPassword(password), firstName, lastName, role, companyId
  }).returning();
  const { passwordHash: _ph, ...safe } = user;
  res.status(201).json(safe);
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { passwordHash: _ph, ...safe } = user;
  res.json(safe);
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { firstName, lastName, role, isActive } = req.body;
  const [user] = await db.update(usersTable).set({ firstName, lastName, role, isActive }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { passwordHash: _ph, ...safe } = user;
  res.json(safe);
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

export default router;
