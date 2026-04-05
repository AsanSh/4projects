import { Router } from "express";
import { eq, and, SQL, sql, asc } from "drizzle-orm";
import {
  db, propertiesTable, tenantsTable, leaseContractsTable,
  accrualsTable, paymentsTable, depositsTable, expensesTable,
  ownerStatementsTable, paymentAllocationsTable
} from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

// TENANTS
router.get("/rental/tenants", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { search, status } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(tenantsTable.companyId, req.companyId));
  let rows = await db.select().from(tenantsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(tenantsTable.createdAt);
  if (status) rows = rows.filter(r => r.status === status);
  if (search) rows = rows.filter(r => r.fullName.toLowerCase().includes(search.toLowerCase()));
  res.json(rows);
});

router.post("/rental/tenants", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { fullName, phone, email, iin, status, comment } = req.body;
  if (!fullName) { res.status(400).json({ error: "fullName required" }); return; }
  const [row] = await db.insert(tenantsTable).values({
    companyId: req.companyId, fullName, phone, email, iin, status: status || "active", comment
  }).returning();
  res.status(201).json(row);
});

router.get("/rental/tenants/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(tenantsTable.id, id)];
  if (req.companyId) conditions.push(eq(tenantsTable.companyId, req.companyId));
  const [row] = await db.select().from(tenantsTable).where(and(...conditions));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/rental/tenants/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { fullName, phone, email, iin, status, comment } = req.body;
  const conditions: SQL[] = [eq(tenantsTable.id, id)];
  if (req.companyId) conditions.push(eq(tenantsTable.companyId, req.companyId));
  const [row] = await db.update(tenantsTable)
    .set({ fullName, phone, email, iin, status, comment })
    .where(and(...conditions)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/rental/tenants/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(tenantsTable.id, id)];
  if (req.companyId) conditions.push(eq(tenantsTable.companyId, req.companyId));
  await db.delete(tenantsTable).where(and(...conditions));
  res.sendStatus(204);
});

// LEASE CONTRACTS
router.get("/rental/contracts", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { propertyId, tenantId, status } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(leaseContractsTable.companyId, req.companyId));
  if (propertyId) conditions.push(eq(leaseContractsTable.propertyId, parseInt(propertyId, 10)));
  if (tenantId) conditions.push(eq(leaseContractsTable.tenantId, parseInt(tenantId, 10)));
  if (status) conditions.push(eq(leaseContractsTable.status, status));

  const contracts = await db.select().from(leaseContractsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(leaseContractsTable.createdAt);

  const enriched = await Promise.all(contracts.map(async (c) => {
    const [t] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, c.tenantId));
    const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, c.propertyId));
    return { ...c, tenantName: t?.fullName ?? null, propertyUnitNumber: p?.unitNumber ?? null };
  }));
  res.json(enriched);
});

router.post("/rental/contracts", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { propertyId, tenantId, contractNumber, startDate, endDate, rentAmount, currency, depositAmount, accrualDay, status, comment } = req.body;
  if (!propertyId || !tenantId || !contractNumber || !startDate || !rentAmount || !currency || !status) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [row] = await db.insert(leaseContractsTable).values({
    companyId: req.companyId, propertyId, tenantId, contractNumber, startDate, endDate, rentAmount, currency, depositAmount, accrualDay, status, comment
  }).returning();

  await db.update(propertiesTable).set({ rentalStatus: "rented" }).where(eq(propertiesTable.id, propertyId));

  if (status === "active" || status === "draft") {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getFullYear(), start.getMonth() + 12, 1);
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const dueDay = accrualDay || 1;
    while (current <= end) {
      const yr = current.getFullYear();
      const mo = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(Math.min(dueDay, new Date(yr, current.getMonth() + 1, 0).getDate())).padStart(2, "0");
      await db.insert(accrualsTable).values({
        companyId: req.companyId,
        leaseContractId: row.id,
        period: `${yr}-${mo}`,
        amount: String(rentAmount),
        currency,
        dueDate: `${yr}-${mo}-${day}`,
        paidAmount: "0",
        balance: String(rentAmount),
        status: "pending",
      });
      current.setMonth(current.getMonth() + 1);
    }
  }

  const [t] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId));
  const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId));
  res.status(201).json({ ...row, tenantName: t?.fullName ?? null, propertyUnitNumber: p?.unitNumber ?? null });
});

router.get("/rental/contracts/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(leaseContractsTable.id, id)];
  if (req.companyId) conditions.push(eq(leaseContractsTable.companyId, req.companyId));
  const [row] = await db.select().from(leaseContractsTable).where(and(...conditions));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const [t] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, row.tenantId));
  const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, row.propertyId));
  res.json({ ...row, tenantName: t?.fullName ?? null, propertyUnitNumber: p?.unitNumber ?? null });
});

router.patch("/rental/contracts/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { startDate, endDate, rentAmount, currency, depositAmount, accrualDay, status, comment } = req.body;
  const conditions: SQL[] = [eq(leaseContractsTable.id, id)];
  if (req.companyId) conditions.push(eq(leaseContractsTable.companyId, req.companyId));
  const [row] = await db.update(leaseContractsTable)
    .set({ startDate, endDate, rentAmount, currency, depositAmount, accrualDay, status, comment })
    .where(and(...conditions)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, tenantName: null, propertyUnitNumber: null });
});

// ACCRUALS
router.get("/rental/accruals", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { leaseContractId, status, month } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(accrualsTable.companyId, req.companyId));
  if (leaseContractId) conditions.push(eq(accrualsTable.leaseContractId, parseInt(leaseContractId, 10)));
  if (status) conditions.push(eq(accrualsTable.status, status));

  let rows = await db.select().from(accrualsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(accrualsTable.dueDate);
  if (month) rows = rows.filter(r => r.period === month);
  res.json(rows);
});

router.post("/rental/accruals/recalculate", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { leaseContractId } = req.body;
  if (!leaseContractId) { res.status(400).json({ error: "leaseContractId required" }); return; }

  const conditions: SQL[] = [eq(leaseContractsTable.id, leaseContractId)];
  if (req.companyId) conditions.push(eq(leaseContractsTable.companyId, req.companyId));
  const [contract] = await db.select().from(leaseContractsTable).where(and(...conditions));
  if (!contract) { res.status(404).json({ error: "Lease contract not found" }); return; }

  await db.delete(accrualsTable).where(eq(accrualsTable.leaseContractId, leaseContractId));

  const start = new Date(contract.startDate);
  const end = contract.endDate ? new Date(contract.endDate) : new Date(start.getFullYear(), start.getMonth() + 12, 1);
  const insertedAccruals = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    const period = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    const dueDay = contract.accrualDay || 1;
    const dueDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;
    const [accrual] = await db.insert(accrualsTable).values({
      companyId: req.companyId,
      leaseContractId,
      period, amount: contract.rentAmount, currency: contract.currency,
      dueDate, paidAmount: "0", balance: contract.rentAmount, status: "pending",
    }).returning();
    insertedAccruals.push(accrual);
    current.setMonth(current.getMonth() + 1);
  }
  res.json(insertedAccruals);
});

router.patch("/rental/accruals/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, notes, discountType, discountAmount, discountReason, gracePeriodDays, dueDate } = req.body;
  const conditions: SQL[] = [eq(accrualsTable.id, id)];
  if (req.companyId) conditions.push(eq(accrualsTable.companyId, req.companyId));

  const [existing] = await db.select().from(accrualsTable).where(and(...conditions));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (dueDate !== undefined) updates.dueDate = dueDate;

  // Льгота / скидка
  if (discountType !== undefined) updates.discountType = discountType;
  if (discountReason !== undefined) updates.discountReason = discountReason;
  if (gracePeriodDays !== undefined) updates.gracePeriodDays = gracePeriodDays;

  if (discountAmount !== undefined) {
    updates.discountAmount = String(discountAmount);
    // Пересчитываем баланс с учётом скидки
    const baseAmount = parseFloat(existing.amount);
    const discount = parseFloat(String(discountAmount));
    const effectiveAmount = Math.max(0, baseAmount - discount);
    const paid = parseFloat(existing.paidAmount);
    const newBalance = Math.max(0, effectiveAmount - paid);
    updates.balance = String(newBalance);
    if (newBalance <= 0) updates.status = "paid";
    else if (paid > 0) updates.status = "partial";
  }

  const [row] = await db.update(accrualsTable).set(updates as any).where(and(...conditions)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// POST /rental/accruals/:id/discount — применить льготу к начислению
router.post("/rental/accruals/:id/discount", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { discountType, discountValue, reason, gracePeriodDays } = req.body;

  if (!discountType) { res.status(400).json({ error: "discountType required (percent/fixed/grace)" }); return; }

  const conditions: SQL[] = [eq(accrualsTable.id, id)];
  if (req.companyId) conditions.push(eq(accrualsTable.companyId, req.companyId));

  const [existing] = await db.select().from(accrualsTable).where(and(...conditions));
  if (!existing) { res.status(404).json({ error: "Начисление не найдено" }); return; }

  const baseAmount = parseFloat(existing.amount);
  const paid = parseFloat(existing.paidAmount);
  let discountAmount = 0;
  let newDueDate = existing.dueDate;

  if (discountType === "percent") {
    discountAmount = (baseAmount * parseFloat(String(discountValue))) / 100;
  } else if (discountType === "fixed") {
    discountAmount = parseFloat(String(discountValue));
  } else if (discountType === "grace") {
    const days = parseInt(String(gracePeriodDays || discountValue || 7), 10);
    const due = new Date(existing.dueDate);
    due.setDate(due.getDate() + days);
    newDueDate = due.toISOString().split("T")[0];
  }

  const effectiveAmount = Math.max(0, baseAmount - discountAmount);
  const newBalance = Math.max(0, effectiveAmount - paid);
  const newStatus = newBalance <= 0 ? "paid" : paid > 0 ? "partial" : "pending";

  const [row] = await db.update(accrualsTable).set({
    discountType,
    discountAmount: discountAmount > 0 ? String(discountAmount) : existing.discountAmount,
    discountReason: reason || existing.discountReason,
    gracePeriodDays: gracePeriodDays ? parseInt(String(gracePeriodDays), 10) : existing.gracePeriodDays,
    dueDate: newDueDate,
    balance: String(newBalance),
    status: newStatus,
  }).where(and(...conditions)).returning();

  res.json(row);
});

// PAYMENTS
router.get("/rental/payments", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { leaseContractId } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(paymentsTable.companyId, req.companyId));
  if (leaseContractId) conditions.push(eq(paymentsTable.leaseContractId, parseInt(leaseContractId, 10)));
  const rows = await db.select().from(paymentsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(paymentsTable.paymentDate);
  res.json(rows);
});

router.post("/rental/payments", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { leaseContractId, amount, currency, paymentDate, paymentMethod, note, allocations } = req.body;
  if (!leaseContractId || !amount || !currency || !paymentDate) {
    res.status(400).json({ error: "leaseContractId, amount, currency, paymentDate required" });
    return;
  }

  const paymentAmount = parseFloat(amount);

  // Создаём запись платежа
  const [payment] = await db.insert(paymentsTable).values({
    companyId: req.companyId,
    leaseContractId,
    amount: String(paymentAmount),
    currency,
    paymentDate,
    paymentMethod: paymentMethod || null,
    note: note || null,
  }).returning();

  let remainingAmount = paymentAmount;
  const createdAllocations = [];

  if (allocations && Array.isArray(allocations) && allocations.length > 0) {
    // Явная аллокация от пользователя
    for (const alloc of allocations) {
      if (remainingAmount <= 0) break;
      const allocAmount = Math.min(parseFloat(String(alloc.amount)), remainingAmount);
      const [accrual] = await db.select().from(accrualsTable).where(eq(accrualsTable.id, alloc.accrualId));
      if (!accrual) continue;

      const [allocation] = await db.insert(paymentAllocationsTable).values({
        companyId: req.companyId,
        paymentId: payment.id,
        accrualId: alloc.accrualId,
        amount: String(allocAmount),
      }).returning();
      createdAllocations.push(allocation);

      const newPaid = parseFloat(accrual.paidAmount) + allocAmount;
      const effectiveAmount = parseFloat(accrual.amount) - parseFloat(accrual.discountAmount ?? "0");
      const newBalance = Math.max(0, effectiveAmount - newPaid);
      const newStatus = newBalance <= 0 ? "paid" : newPaid > 0 ? "partial" : "pending";
      await db.update(accrualsTable).set({
        paidAmount: String(newPaid), balance: String(newBalance), status: newStatus,
      }).where(eq(accrualsTable.id, alloc.accrualId));

      remainingAmount -= allocAmount;
    }
  } else {
    // Авто-аллокация: самые старые начисления первыми
    const pendingAccruals = await db.select().from(accrualsTable)
      .where(and(
        eq(accrualsTable.leaseContractId, leaseContractId),
        sql`${accrualsTable.balance} > 0`
      ))
      .orderBy(asc(accrualsTable.dueDate));

    for (const accrual of pendingAccruals) {
      if (remainingAmount <= 0) break;
      const balance = parseFloat(accrual.balance);
      const allocAmount = Math.min(balance, remainingAmount);

      const [allocation] = await db.insert(paymentAllocationsTable).values({
        companyId: req.companyId,
        paymentId: payment.id,
        accrualId: accrual.id,
        amount: String(allocAmount),
      }).returning();
      createdAllocations.push(allocation);

      const newPaid = parseFloat(accrual.paidAmount) + allocAmount;
      const newBalance = Math.max(0, balance - allocAmount);
      const newStatus = newBalance <= 0 ? "paid" : "partial";
      await db.update(accrualsTable).set({
        paidAmount: String(newPaid), balance: String(newBalance), status: newStatus,
      }).where(eq(accrualsTable.id, accrual.id));

      remainingAmount -= allocAmount;
    }
  }

  res.status(201).json({ ...payment, allocations: createdAllocations, unallocated: remainingAmount });
});

// DEPOSITS
router.get("/rental/deposits", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { leaseContractId, status } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(depositsTable.companyId, req.companyId));
  if (leaseContractId) conditions.push(eq(depositsTable.leaseContractId, parseInt(leaseContractId, 10)));
  if (status) conditions.push(eq(depositsTable.status, status));
  const rows = await db.select().from(depositsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(depositsTable.createdAt);
  res.json(rows);
});

router.post("/rental/deposits", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { leaseContractId, amount, currency, receivedDate, note } = req.body;
  if (!leaseContractId || !amount || !currency || !receivedDate) {
    res.status(400).json({ error: "leaseContractId, amount, currency, receivedDate required" });
    return;
  }
  const [row] = await db.insert(depositsTable).values({
    companyId: req.companyId, leaseContractId, amount, currency, status: "held", receivedDate, note
  }).returning();
  res.status(201).json(row);
});

router.patch("/rental/deposits/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, returnedAmount, returnedDate, note } = req.body;
  const conditions: SQL[] = [eq(depositsTable.id, id)];
  if (req.companyId) conditions.push(eq(depositsTable.companyId, req.companyId));
  const [row] = await db.update(depositsTable)
    .set({ status, returnedAmount, returnedDate, note })
    .where(and(...conditions)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// EXPENSES
router.get("/rental/expenses", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { propertyId, category } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(expensesTable.companyId, req.companyId));
  if (propertyId) conditions.push(eq(expensesTable.propertyId, parseInt(propertyId, 10)));
  if (category) conditions.push(eq(expensesTable.category, category));
  const rows = await db.select().from(expensesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(expensesTable.expenseDate);
  res.json(rows);
});

router.post("/rental/expenses", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { propertyId, leaseContractId, category, amount, currency, expenseDate, description } = req.body;
  if (!propertyId || !category || !amount || !currency || !expenseDate) {
    res.status(400).json({ error: "propertyId, category, amount, currency, expenseDate required" });
    return;
  }
  const [row] = await db.insert(expensesTable).values({
    companyId: req.companyId, propertyId, leaseContractId, category, amount, currency, expenseDate, description
  }).returning();
  res.status(201).json(row);
});

// RENTAL PROPERTIES
router.get("/rental/properties", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { rentalStatus } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(propertiesTable.companyId, req.companyId));
  let props = await db.select().from(propertiesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(propertiesTable.createdAt);
  if (rentalStatus) props = props.filter(p => p.rentalStatus === rentalStatus);

  const enriched = await Promise.all(props.map(async (p) => {
    const activeConditions: SQL[] = [eq(leaseContractsTable.propertyId, p.id), eq(leaseContractsTable.status, "active")];
    const [activeContract] = await db.select().from(leaseContractsTable).where(and(...activeConditions));

    let currentTenantName = null;
    let currentRentAmount = null;
    let currency = null;
    let leaseEndDate = null;

    if (activeContract) {
      const [t] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, activeContract.tenantId));
      currentTenantName = t?.fullName ?? null;
      currentRentAmount = parseFloat(activeContract.rentAmount);
      currency = activeContract.currency;
      leaseEndDate = activeContract.endDate;
    }

    const accruals = await db.select().from(accrualsTable).where(
      eq(accrualsTable.leaseContractId, activeContract?.id ?? -1)
    );
    const totalBalance = accruals.reduce((sum, a) => sum + parseFloat(a.balance), 0);

    return {
      id: p.id, propertyId: p.id, unitNumber: p.unitNumber, projectName: p.projectName,
      type: p.type, area: p.area ? parseFloat(p.area) : null, rentalStatus: p.rentalStatus || "free",
      currentTenantName, currentRentAmount, currency, leaseEndDate,
      totalBalance, isActive: true, createdAt: p.createdAt.toISOString(),
    };
  }));
  res.json(enriched);
});

router.post("/rental/properties/:id/activate", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(propertiesTable.id, id)];
  if (req.companyId) conditions.push(eq(propertiesTable.companyId, req.companyId));
  const [prop] = await db.update(propertiesTable)
    .set({ rentalStatus: "free", status: "on_lease" })
    .where(and(...conditions)).returning();
  if (!prop) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: prop.id, propertyId: prop.id, unitNumber: prop.unitNumber, projectName: prop.projectName,
    type: prop.type, area: prop.area ? parseFloat(prop.area) : null, rentalStatus: prop.rentalStatus || "free",
    currentTenantName: null, currentRentAmount: null, currency: null, leaseEndDate: null,
    totalBalance: 0, isActive: true, createdAt: prop.createdAt.toISOString(),
  });
});

router.get("/rental/properties/:id/performance", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(propertiesTable.id, id)];
  if (req.companyId) conditions.push(eq(propertiesTable.companyId, req.companyId));
  const [prop] = await db.select().from(propertiesTable).where(and(...conditions));
  if (!prop) { res.status(404).json({ error: "Not found" }); return; }

  const contractConditions: SQL[] = [eq(leaseContractsTable.propertyId, id)];
  if (req.companyId) contractConditions.push(eq(leaseContractsTable.companyId, req.companyId));
  const contracts = await db.select().from(leaseContractsTable).where(and(...contractConditions));
  const contractIds = contracts.map(c => c.id);

  let totalRentCharged = 0, totalRentReceived = 0, occupancyMonths = 0;
  for (const cid of contractIds) {
    const accruals = await db.select().from(accrualsTable).where(eq(accrualsTable.leaseContractId, cid));
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.leaseContractId, cid));
    totalRentCharged += accruals.reduce((s, a) => s + parseFloat(a.amount), 0);
    totalRentReceived += payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    occupancyMonths += accruals.length;
  }

  const expenseConditions: SQL[] = [eq(expensesTable.propertyId, id)];
  if (req.companyId) expenseConditions.push(eq(expensesTable.companyId, req.companyId));
  const expensesList = await db.select().from(expensesTable).where(and(...expenseConditions));
  const totalExpenses = expensesList.reduce((s, e) => s + parseFloat(e.amount), 0);
  const netIncome = totalRentReceived - totalExpenses;
  const outstandingBalance = totalRentCharged - totalRentReceived;

  res.json({
    propertyId: id, unitNumber: prop.unitNumber,
    totalRentCharged, totalRentReceived, totalExpenses, netIncome, outstandingBalance,
    currency: "KGS", occupancyMonths, vacancyMonths: 0,
  });
});

// OWNER STATEMENTS
router.get("/rental/statements", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { propertyId, month } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (req.companyId) conditions.push(eq(ownerStatementsTable.companyId, req.companyId));
  if (propertyId) conditions.push(eq(ownerStatementsTable.propertyId, parseInt(propertyId, 10)));
  if (month) conditions.push(eq(ownerStatementsTable.period, month));
  const rows = await db.select().from(ownerStatementsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(ownerStatementsTable.generatedAt);

  const enriched = await Promise.all(rows.map(async (s) => {
    const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, s.propertyId));
    return { ...s, unitNumber: p?.unitNumber ?? "" };
  }));
  res.json(enriched);
});

router.post("/rental/statements/generate", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { propertyId, period } = req.body;
  if (!propertyId || !period) {
    res.status(400).json({ error: "propertyId and period required" });
    return;
  }

  const propConditions: SQL[] = [eq(propertiesTable.id, propertyId)];
  if (req.companyId) propConditions.push(eq(propertiesTable.companyId, req.companyId));
  const [prop] = await db.select().from(propertiesTable).where(and(...propConditions));
  if (!prop) { res.status(404).json({ error: "Property not found" }); return; }

  const contractConditions: SQL[] = [eq(leaseContractsTable.propertyId, propertyId)];
  if (req.companyId) contractConditions.push(eq(leaseContractsTable.companyId, req.companyId));
  const contracts = await db.select().from(leaseContractsTable).where(and(...contractConditions));

  let rentCharged = 0, rentReceived = 0;
  let currency = "KGS";

  for (const c of contracts) {
    const accruals = await db.select().from(accrualsTable).where(
      and(eq(accrualsTable.leaseContractId, c.id), eq(accrualsTable.period, period))
    );
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.leaseContractId, c.id));
    rentCharged += accruals.reduce((s, a) => s + parseFloat(a.amount), 0);
    rentReceived += payments.filter(p => p.paymentDate.startsWith(period)).reduce((s, p) => s + parseFloat(p.amount), 0);
    currency = c.currency;
  }

  const expenseConditions: SQL[] = [eq(expensesTable.propertyId, propertyId)];
  if (req.companyId) expenseConditions.push(eq(expensesTable.companyId, req.companyId));
  const expensesList = await db.select().from(expensesTable).where(and(...expenseConditions));
  const periodExpenses = expensesList.filter(e => e.expenseDate.startsWith(period));
  const expenses = periodExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const netIncome = rentReceived - expenses;

  const [stmt] = await db.insert(ownerStatementsTable).values({
    companyId: req.companyId,
    propertyId, period,
    rentCharged: String(rentCharged),
    rentReceived: String(rentReceived),
    expenses: String(expenses),
    netIncome: String(netIncome),
    currency,
  }).returning();

  res.json({ ...stmt, unitNumber: prop.unitNumber });
});

export default router;
