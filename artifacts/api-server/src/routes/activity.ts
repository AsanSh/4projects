import { Router } from "express";
import { eq, desc, SQL, and, inArray } from "drizzle-orm";
import {
  db, activityLogTable,
  paymentsTable, accrualsTable, depositsTable, expensesTable,
  leaseContractsTable, tenantsTable,
} from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

// ── Helpers ────────────────────────────────────────────────────────

const RESTORE_MAP: Record<string, { table: any; label: string }> = {
  payment:   { table: paymentsTable,       label: "Платёж" },
  accrual:   { table: accrualsTable,       label: "Начисление" },
  deposit:   { table: depositsTable,       label: "Депозит" },
  expense:   { table: expensesTable,       label: "Расход" },
  contract:  { table: leaseContractsTable, label: "Договор" },
  tenant:    { table: tenantsTable,        label: "Арендатор" },
};

// ── GET /activity  ─────────────────────────────────────────────────

router.get("/activity", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { entityType, entityId, module, actionType, limit } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(activityLogTable.companyId, req.companyId));
  if (entityType && entityType !== "all") conditions.push(eq(activityLogTable.entityType, entityType));
  if (entityId)   conditions.push(eq(activityLogTable.entityId, parseInt(entityId, 10)));
  if (module && module !== "all") conditions.push(eq(activityLogTable.module, module));
  if (actionType && actionType !== "all") conditions.push(eq(activityLogTable.actionType, actionType));

  const rows = await db.select().from(activityLogTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(parseInt(limit || "500", 10));
  res.json(rows);
});

// ── POST /activity  ────────────────────────────────────────────────

router.post("/activity", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { type, description, entityType, entityId, module, actionType, snapshot } = req.body;
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
    module: module || null,
    actionType: actionType || null,
    snapshot: snapshot ? JSON.stringify(snapshot) : null,
  }).returning();
  res.status(201).json(row);
});

// ── POST /activity/:id/restore  ────────────────────────────────────

router.post("/activity/:id/restore", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const companyId = req.companyId!;

  const [entry] = await db.select().from(activityLogTable)
    .where(and(eq(activityLogTable.id, id), eq(activityLogTable.companyId, companyId)));

  if (!entry) { res.status(404).json({ error: "Запись не найдена" }); return; }
  if (!entry.snapshot) { res.status(400).json({ error: "Снапшот недоступен для восстановления" }); return; }
  if (entry.restoredAt) { res.status(400).json({ error: "Запись уже восстановлена" }); return; }
  if (entry.actionType !== "delete") { res.status(400).json({ error: "Восстановление доступно только для удалённых записей" }); return; }

  const entityType = entry.entityType;
  if (!entityType || !RESTORE_MAP[entityType]) {
    res.status(400).json({ error: `Тип записи '${entityType}' не поддерживает восстановление` }); return;
  }

  let data: any;
  try { data = JSON.parse(entry.snapshot); } catch {
    res.status(400).json({ error: "Не удалось распарсить снапшот" }); return;
  }

  // Strip the primary key so DB assigns a new one
  const { id: _id, ...restoreData } = data;
  // Ensure companyId isolation
  restoreData.companyId = companyId;

  const { table } = RESTORE_MAP[entityType];
  const [restored] = await db.insert(table).values(restoreData).returning();

  // Mark as restored
  await db.update(activityLogTable)
    .set({ restoredAt: new Date() })
    .where(eq(activityLogTable.id, id));

  // Log the restore action
  await db.insert(activityLogTable).values({
    companyId,
    type: entityType,
    description: `Восстановлена запись (${entityType} #${restored.id}) из удалённого состояния`,
    entityType,
    entityId: restored.id,
    userId: req.userId,
    module: entry.module,
    actionType: "restore",
  });

  res.json({ restored, logId: id });
});

export default router;
