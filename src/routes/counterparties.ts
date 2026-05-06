import { Router } from "express";
import { eq, ilike, and, SQL } from "drizzle-orm";
import { db, counterpartiesTable } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

router.get("/counterparties", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { type, search } = req.query as { type?: string; search?: string };
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(counterpartiesTable.companyId, req.companyId));
  if (type) conditions.push(eq(counterpartiesTable.type, type));
  if (search) conditions.push(ilike(counterpartiesTable.fullName, `%${search}%`));

  const rows = await db.select().from(counterpartiesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(counterpartiesTable.createdAt);
  res.json(rows);
});

router.post("/counterparties", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { type, fullName, iin, phone, email, additionalContact, comment, externalId } = req.body;
  if (!type || !fullName) { res.status(400).json({ error: "type and fullName are required" }); return; }
  const [row] = await db.insert(counterpartiesTable).values({
    companyId: req.companyId, type, fullName, iin, phone, email, additionalContact, comment, externalId
  }).returning();
  res.status(201).json(row);
});

router.get("/counterparties/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(counterpartiesTable.id, id)];
  if (req.companyId) conditions.push(eq(counterpartiesTable.companyId, req.companyId));
  const [row] = await db.select().from(counterpartiesTable).where(and(...conditions));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/counterparties/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { type, fullName, iin, phone, email, additionalContact, comment } = req.body;
  const conditions: SQL[] = [eq(counterpartiesTable.id, id)];
  if (req.companyId) conditions.push(eq(counterpartiesTable.companyId, req.companyId));
  const [row] = await db.update(counterpartiesTable)
    .set({ type, fullName, iin, phone, email, additionalContact, comment })
    .where(and(...conditions)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/counterparties/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(counterpartiesTable.id, id)];
  if (req.companyId) conditions.push(eq(counterpartiesTable.companyId, req.companyId));
  await db.delete(counterpartiesTable).where(and(...conditions));
  res.sendStatus(204);
});

export default router;
