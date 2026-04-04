import { Router } from "express";
import { eq, ilike, and, SQL } from "drizzle-orm";
import { db, counterpartiesTable } from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

router.get("/counterparties", async (req, res): Promise<void> => {
  const { type, search } = req.query as { type?: string; search?: string };
  const conditions: SQL[] = [];
  if (type) conditions.push(eq(counterpartiesTable.type, type));
  if (search) conditions.push(ilike(counterpartiesTable.fullName, `%${search}%`));

  const rows = conditions.length
    ? await db.select().from(counterpartiesTable).where(and(...conditions)).orderBy(counterpartiesTable.createdAt)
    : await db.select().from(counterpartiesTable).orderBy(counterpartiesTable.createdAt);

  res.json(rows);
});

router.post("/counterparties", async (req, res): Promise<void> => {
  const { type, fullName, iin, phone, email, additionalContact, comment, externalId } = req.body;
  if (!type || !fullName) { res.status(400).json({ error: "type and fullName are required" }); return; }
  const [row] = await db.insert(counterpartiesTable).values({ type, fullName, iin, phone, email, additionalContact, comment, externalId }).returning();
  res.status(201).json(row);
});

router.get("/counterparties/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.select().from(counterpartiesTable).where(eq(counterpartiesTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/counterparties/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { type, fullName, iin, phone, email, additionalContact, comment } = req.body;
  const [row] = await db.update(counterpartiesTable).set({ type, fullName, iin, phone, email, additionalContact, comment }).where(eq(counterpartiesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/counterparties/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(counterpartiesTable).where(eq(counterpartiesTable.id, id));
  res.sendStatus(204);
});

export default router;
