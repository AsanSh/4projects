import { Router } from "express";
import { eq, ilike, and, SQL } from "drizzle-orm";
import { db, propertiesTable } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

router.get("/properties", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { status, project, type, search } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(propertiesTable.companyId, req.companyId));
  if (status) conditions.push(eq(propertiesTable.status, status));
  if (project) conditions.push(ilike(propertiesTable.projectName, `%${project}%`));
  if (type) conditions.push(eq(propertiesTable.type, type));
  if (search) conditions.push(ilike(propertiesTable.unitNumber, `%${search}%`));

  const rows = await db.select().from(propertiesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(propertiesTable.createdAt);
  res.json(rows);
});

router.post("/properties", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { projectName, block, floor, unitNumber, type, area, status, comment, externalId } = req.body;
  if (!projectName || !unitNumber || !type || !status) {
    res.status(400).json({ error: "projectName, unitNumber, type, status required" });
    return;
  }
  const [row] = await db.insert(propertiesTable).values({
    companyId: req.companyId, projectName, block, floor, unitNumber, type, area, status, comment, externalId
  }).returning();
  res.status(201).json(row);
});

router.get("/properties/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(propertiesTable.id, id)];
  if (req.companyId) conditions.push(eq(propertiesTable.companyId, req.companyId));
  const [row] = await db.select().from(propertiesTable).where(and(...conditions));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/properties/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { projectName, block, floor, unitNumber, type, area, status, comment } = req.body;
  const conditions: SQL[] = [eq(propertiesTable.id, id)];
  if (req.companyId) conditions.push(eq(propertiesTable.companyId, req.companyId));
  const [row] = await db.update(propertiesTable)
    .set({ projectName, block, floor, unitNumber, type, area, status, comment })
    .where(and(...conditions)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/properties/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(propertiesTable.id, id)];
  if (req.companyId) conditions.push(eq(propertiesTable.companyId, req.companyId));
  await db.delete(propertiesTable).where(and(...conditions));
  res.sendStatus(204);
});

export default router;
