import { Router } from "express";
import { eq, desc, SQL, and } from "drizzle-orm";
import { db, activityLogTable } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

router.get("/activity", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { entityType, entityId, limit } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(activityLogTable.companyId, req.companyId));
  if (entityType) conditions.push(eq(activityLogTable.entityType, entityType));
  if (entityId) conditions.push(eq(activityLogTable.entityId, parseInt(entityId, 10)));

  const rows = await db.select().from(activityLogTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(parseInt(limit || "200", 10));
  res.json(rows);
});

router.post("/activity", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { type, description, entityType, entityId } = req.body;
  if (!type || !description) {
    res.status(400).json({ error: "type and description required" });
    return;
  }
  const [row] = await db.insert(activityLogTable).values({
    companyId: req.companyId,
    type,
    description,
    entityType,
    entityId,
    userId: req.userId,
  }).returning();
  res.status(201).json(row);
});

export default router;
