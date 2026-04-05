import { Router } from "express";
import { eq, desc, SQL, and } from "drizzle-orm";
import { db, activityLogTable } from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const { entityType, entityId, limit } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (entityType) conditions.push(eq(activityLogTable.entityType, entityType));
  if (entityId) conditions.push(eq(activityLogTable.entityId, parseInt(entityId, 10)));

  const rows = conditions.length
    ? await db.select().from(activityLogTable).where(and(...conditions)).orderBy(desc(activityLogTable.createdAt)).limit(parseInt(limit || "100", 10))
    : await db.select().from(activityLogTable).orderBy(desc(activityLogTable.createdAt)).limit(parseInt(limit || "100", 10));

  res.json(rows);
});

router.post("/activity", async (req, res): Promise<void> => {
  const { type, description, entityType, entityId, userId } = req.body;
  if (!type || !description) {
    res.status(400).json({ error: "type and description required" });
    return;
  }
  const [row] = await db.insert(activityLogTable).values({ type, description, entityType, entityId, userId }).returning();
  res.status(201).json(row);
});

export default router;
