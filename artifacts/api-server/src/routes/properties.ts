import { Router } from "express";
import { eq, ilike, and, SQL } from "drizzle-orm";
import { db, propertiesTable } from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

router.get("/properties", async (req, res): Promise<void> => {
  const { status, project, type, search } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (status) conditions.push(eq(propertiesTable.status, status));
  if (project) conditions.push(ilike(propertiesTable.projectName, `%${project}%`));
  if (type) conditions.push(eq(propertiesTable.type, type));
  if (search) conditions.push(ilike(propertiesTable.unitNumber, `%${search}%`));

  const rows = conditions.length
    ? await db.select().from(propertiesTable).where(and(...conditions)).orderBy(propertiesTable.createdAt)
    : await db.select().from(propertiesTable).orderBy(propertiesTable.createdAt);
  res.json(rows);
});

router.post("/properties", async (req, res): Promise<void> => {
  const { projectName, block, floor, unitNumber, type, area, status, comment, externalId } = req.body;
  if (!projectName || !unitNumber || !type || !status) {
    res.status(400).json({ error: "projectName, unitNumber, type, status required" });
    return;
  }
  const [row] = await db.insert(propertiesTable).values({ projectName, block, floor, unitNumber, type, area, status, comment, externalId }).returning();
  res.status(201).json(row);
});

router.get("/properties/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/properties/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { projectName, block, floor, unitNumber, type, area, status, comment } = req.body;
  const [row] = await db.update(propertiesTable).set({ projectName, block, floor, unitNumber, type, area, status, comment }).where(eq(propertiesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/properties/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(propertiesTable).where(eq(propertiesTable.id, id));
  res.sendStatus(204);
});

export default router;
