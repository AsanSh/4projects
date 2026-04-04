import { Router } from "express";
import { eq, and, SQL } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const { entityType, entityId } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (entityType) conditions.push(eq(documentsTable.entityType, entityType));
  if (entityId) conditions.push(eq(documentsTable.entityId, parseInt(entityId, 10)));

  const rows = conditions.length
    ? await db.select().from(documentsTable).where(and(...conditions)).orderBy(documentsTable.createdAt)
    : await db.select().from(documentsTable).orderBy(documentsTable.createdAt);
  res.json(rows);
});

router.post("/documents", async (req, res): Promise<void> => {
  const { entityType, entityId, name, fileUrl, fileSize, mimeType } = req.body;
  if (!entityType || !entityId || !name || !fileUrl) {
    res.status(400).json({ error: "entityType, entityId, name, fileUrl required" });
    return;
  }
  const [row] = await db.insert(documentsTable).values({ entityType, entityId, name, fileUrl, fileSize, mimeType }).returning();
  res.status(201).json(row);
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.sendStatus(204);
});

export default router;
