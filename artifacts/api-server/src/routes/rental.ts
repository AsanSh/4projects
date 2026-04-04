import { Router } from "express";
import { eq, and, SQL, sql } from "drizzle-orm";
import {
  db, propertiesTable, tenantsTable, leaseContractsTable,
  accrualsTable, paymentsTable, depositsTable, expensesTable,
  ownerStatementsTable
} from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

// TENANTS
router.get("/rental/tenants", async (req, res): Promise<void> => {
  const { search, status } = req.query as Record<string, string | undefined>;
  let rows = await db.select().from(tenantsTable).orderBy(tenantsTable.createdAt);
  if (status) rows = rows.filter(r => r.status === status);
  if (search) rows = rows.filter(r => r.fullName.toLowerCase().includes(search.toLowerCase()));
  res.json(rows);
});

router.post("/rental/tenants", async (req, res): Promise<void> => {
  const { fullName, phone, email, iin, status, comment } = req.body;
  if (!fullName) { res.status(400).json({ error: "fullName required" }); return; }
  const [row] = await db.insert(tenantsTable).values({ fullName, phone, email, iin, status: status || "active", comment }).returning();
  res.status(201).json(row);
});

router.get("/rental/tenants/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/rental/tenants/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { fullName, phone, email, iin, status, comment } = req.body;
  const [row] = await db.update(tenantsTable).set({ fullName, phone, email, iin, status, comment }).where(eq(tenantsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// LEASE CONTRACTS
router.get("/rental/contracts", async (req, res): Promise<void> => {
  const { propertyId, tenantId, status } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (propertyId) conditions.push(eq(leaseContractsTable.propertyId, parseInt(propertyId, 10)));
  if (tenantId) conditions.push(eq(leaseContractsTable.tenantId, parseInt(tenantId, 10)));
  if (status) conditions.push(eq(leaseContractsTable.status, status));

  const contracts = conditions.length
    ? await db.select().from(leaseContractsTable).where(and(...conditions)).orderBy(leaseContractsTable.createdAt)
    : await db.select().from(leaseContractsTable).orderBy(leaseContractsTable.createdAt);

  const enriched = await Promise.all(contracts.map(async (c) => {
    const [t] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, c.tenantId));
    const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, c.propertyId));
    return { ...c, tenantName: t?.fullName ?? null, propertyUnitNumber: p?.unitNumber ?? null };
  }));
  res.json(enriched);
});

router.post("/rental/contracts", async (req, res): Promise<void> => {
  const { propertyId, tenantId, contractNumber, startDate, endDate, rentAmount, currency, depositAmount, accrualDay, status, comment } = req.body;
  if (!propertyId || !tenantId || !contractNumber || !startDate || !rentAmount || !currency || !status) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [row] = await db.insert(leaseContractsTable).values({
    propertyId, tenantId, contractNumber, startDate, endDate, rentAmount, currency, depositAmount, accrualDay, status, comment
  }).returning();

  // Update property rental status
  await db.update(propertiesTable).set({ rentalStatus: "rented" }).where(eq(propertiesTable.id, propertyId));

  // Auto-generate accruals for the lease period
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

router.get("/rental/contracts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.select().from(leaseContractsTable).where(eq(leaseContractsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const [t] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, row.tenantId));
  const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, row.propertyId));
  res.json({ ...row, tenantName: t?.fullName ?? null, propertyUnitNumber: p?.unitNumber ?? null });
});

router.patch("/rental/contracts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { startDate, endDate, rentAmount, currency, depositAmount, accrualDay, status, comment } = req.body;
  const [row] = await db.update(leaseContractsTable).set({ startDate, endDate, rentAmount, currency, depositAmount, accrualDay, status, comment }).where(eq(leaseContractsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, tenantName: null, propertyUnitNumber: null });
});

// ACCRUALS
router.get("/rental/accruals", async (req, res): Promise<void> => {
  const { leaseContractId, status, month } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (leaseContractId) conditions.push(eq(accrualsTable.leaseContractId, parseInt(leaseContractId, 10)));
  if (status) conditions.push(eq(accrualsTable.status, status));

  let rows = conditions.length
    ? await db.select().from(accrualsTable).where(and(...conditions)).orderBy(accrualsTable.dueDate)
    : await db.select().from(accrualsTable).orderBy(accrualsTable.dueDate);

  if (month) rows = rows.filter(r => r.period === month);
  res.json(rows);
});

router.post("/rental/accruals/recalculate", async (req, res): Promise<void> => {
  const { leaseContractId } = req.body;
  if (!leaseContractId) { res.status(400).json({ error: "leaseContractId required" }); return; }

  const [contract] = await db.select().from(leaseContractsTable).where(eq(leaseContractsTable.id, leaseContractId));
  if (!contract) { res.status(404).json({ error: "Lease contract not found" }); return; }

  // Delete existing accruals and regenerate
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
      leaseContractId,
      period,
      amount: contract.rentAmount,
      currency: contract.currency,
      dueDate,
      paidAmount: "0",
      balance: contract.rentAmount,
      status: "pending",
    }).returning();
    insertedAccruals.push(accrual);
    current.setMonth(current.getMonth() + 1);
  }

  res.json(insertedAccruals);
});

// Update individual accrual status (approve / cancel / etc.)
router.patch("/rental/accruals/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "status required" }); return; }
  const [row] = await db.update(accrualsTable).set({ status }).where(eq(accrualsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// PAYMENTS
router.get("/rental/payments", async (req, res): Promise<void> => {
  const { leaseContractId, tenantId, status } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (leaseContractId) conditions.push(eq(paymentsTable.leaseContractId, parseInt(leaseContractId, 10)));

  let rows = conditions.length
    ? await db.select().from(paymentsTable).where(and(...conditions)).orderBy(paymentsTable.paymentDate)
    : await db.select().from(paymentsTable).orderBy(paymentsTable.paymentDate);

  res.json(rows);
});

router.post("/rental/payments", async (req, res): Promise<void> => {
  const { leaseContractId, accrualId, amount, currency, paymentDate, paymentMethod, note } = req.body;
  if (!leaseContractId || !amount || !currency || !paymentDate) {
    res.status(400).json({ error: "leaseContractId, amount, currency, paymentDate required" });
    return;
  }
  const [row] = await db.insert(paymentsTable).values({ leaseContractId, accrualId, amount, currency, paymentDate, paymentMethod, note }).returning();

  // Update linked accrual if provided
  if (accrualId) {
    const [accrual] = await db.select().from(accrualsTable).where(eq(accrualsTable.id, accrualId));
    if (accrual) {
      const newPaid = parseFloat(accrual.paidAmount) + parseFloat(amount);
      const newBalance = Math.max(0, parseFloat(accrual.amount) - newPaid);
      const newStatus = newBalance <= 0 ? "paid" : newPaid > 0 ? "partial" : "pending";
      await db.update(accrualsTable).set({
        paidAmount: String(newPaid),
        balance: String(newBalance),
        status: newStatus,
      }).where(eq(accrualsTable.id, accrualId));
    }
  }

  res.status(201).json(row);
});

// DEPOSITS
router.get("/rental/deposits", async (req, res): Promise<void> => {
  const { leaseContractId, status } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (leaseContractId) conditions.push(eq(depositsTable.leaseContractId, parseInt(leaseContractId, 10)));
  if (status) conditions.push(eq(depositsTable.status, status));

  const rows = conditions.length
    ? await db.select().from(depositsTable).where(and(...conditions)).orderBy(depositsTable.createdAt)
    : await db.select().from(depositsTable).orderBy(depositsTable.createdAt);
  res.json(rows);
});

router.post("/rental/deposits", async (req, res): Promise<void> => {
  const { leaseContractId, amount, currency, receivedDate, note } = req.body;
  if (!leaseContractId || !amount || !currency || !receivedDate) {
    res.status(400).json({ error: "leaseContractId, amount, currency, receivedDate required" });
    return;
  }
  const [row] = await db.insert(depositsTable).values({ leaseContractId, amount, currency, status: "held", receivedDate, note }).returning();
  res.status(201).json(row);
});

router.patch("/rental/deposits/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, returnedAmount, returnedDate, note } = req.body;
  const [row] = await db.update(depositsTable).set({ status, returnedAmount, returnedDate, note }).where(eq(depositsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// EXPENSES
router.get("/rental/expenses", async (req, res): Promise<void> => {
  const { propertyId, category } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (propertyId) conditions.push(eq(expensesTable.propertyId, parseInt(propertyId, 10)));
  if (category) conditions.push(eq(expensesTable.category, category));

  const rows = conditions.length
    ? await db.select().from(expensesTable).where(and(...conditions)).orderBy(expensesTable.expenseDate)
    : await db.select().from(expensesTable).orderBy(expensesTable.expenseDate);
  res.json(rows);
});

router.post("/rental/expenses", async (req, res): Promise<void> => {
  const { propertyId, leaseContractId, category, amount, currency, expenseDate, description } = req.body;
  if (!propertyId || !category || !amount || !currency || !expenseDate) {
    res.status(400).json({ error: "propertyId, category, amount, currency, expenseDate required" });
    return;
  }
  const [row] = await db.insert(expensesTable).values({ propertyId, leaseContractId, category, amount, currency, expenseDate, description }).returning();
  res.status(201).json(row);
});

// RENTAL PROPERTIES
router.get("/rental/properties", async (req, res): Promise<void> => {
  const { rentalStatus } = req.query as Record<string, string | undefined>;
  let props = await db.select().from(propertiesTable).orderBy(propertiesTable.createdAt);
  if (rentalStatus) props = props.filter(p => p.rentalStatus === rentalStatus);

  const enriched = await Promise.all(props.map(async (p) => {
    // Get active lease contract
    const [activeContract] = await db.select().from(leaseContractsTable)
      .where(and(eq(leaseContractsTable.propertyId, p.id), eq(leaseContractsTable.status, "active")));

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

    // Calculate outstanding balance from accruals
    const accruals = await db.select().from(accrualsTable).where(
      eq(accrualsTable.leaseContractId, activeContract?.id ?? -1)
    );
    const totalBalance = accruals.reduce((sum, a) => sum + parseFloat(a.balance), 0);

    return {
      id: p.id,
      propertyId: p.id,
      unitNumber: p.unitNumber,
      projectName: p.projectName,
      type: p.type,
      area: p.area ? parseFloat(p.area) : null,
      rentalStatus: p.rentalStatus || "free",
      currentTenantName,
      currentRentAmount,
      currency,
      leaseEndDate,
      totalBalance,
      isActive: true,
      createdAt: p.createdAt.toISOString(),
    };
  }));

  res.json(enriched);
});

router.post("/rental/properties/:id/activate", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [prop] = await db.update(propertiesTable).set({ rentalStatus: "free", status: "on_lease" }).where(eq(propertiesTable.id, id)).returning();
  if (!prop) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: prop.id, propertyId: prop.id, unitNumber: prop.unitNumber, projectName: prop.projectName,
    type: prop.type, area: prop.area ? parseFloat(prop.area) : null, rentalStatus: prop.rentalStatus || "free",
    currentTenantName: null, currentRentAmount: null, currency: null, leaseEndDate: null,
    totalBalance: 0, isActive: true, createdAt: prop.createdAt.toISOString(),
  });
});

router.get("/rental/properties/:id/performance", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
  if (!prop) { res.status(404).json({ error: "Not found" }); return; }

  const contracts = await db.select().from(leaseContractsTable).where(eq(leaseContractsTable.propertyId, id));
  const contractIds = contracts.map(c => c.id);

  let totalRentCharged = 0;
  let totalRentReceived = 0;
  let occupancyMonths = 0;

  for (const cid of contractIds) {
    const accruals = await db.select().from(accrualsTable).where(eq(accrualsTable.leaseContractId, cid));
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.leaseContractId, cid));
    totalRentCharged += accruals.reduce((s, a) => s + parseFloat(a.amount), 0);
    totalRentReceived += payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    occupancyMonths += accruals.length;
  }

  const expensesList = await db.select().from(expensesTable).where(eq(expensesTable.propertyId, id));
  const totalExpenses = expensesList.reduce((s, e) => s + parseFloat(e.amount), 0);
  const netIncome = totalRentReceived - totalExpenses;
  const outstandingBalance = totalRentCharged - totalRentReceived;

  res.json({
    propertyId: id,
    unitNumber: prop.unitNumber,
    totalRentCharged,
    totalRentReceived,
    totalExpenses,
    netIncome,
    outstandingBalance,
    currency: "KZT",
    occupancyMonths,
    vacancyMonths: 0,
  });
});

// OWNER STATEMENTS
router.get("/rental/statements", async (req, res): Promise<void> => {
  const { propertyId, month } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (propertyId) conditions.push(eq(ownerStatementsTable.propertyId, parseInt(propertyId, 10)));
  if (month) conditions.push(eq(ownerStatementsTable.period, month));

  const rows = conditions.length
    ? await db.select().from(ownerStatementsTable).where(and(...conditions)).orderBy(ownerStatementsTable.generatedAt)
    : await db.select().from(ownerStatementsTable).orderBy(ownerStatementsTable.generatedAt);

  const enriched = await Promise.all(rows.map(async (s) => {
    const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, s.propertyId));
    return { ...s, unitNumber: p?.unitNumber ?? "" };
  }));
  res.json(enriched);
});

router.post("/rental/statements/generate", async (req, res): Promise<void> => {
  const { propertyId, period } = req.body;
  if (!propertyId || !period) {
    res.status(400).json({ error: "propertyId and period required" });
    return;
  }

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId));
  if (!prop) { res.status(404).json({ error: "Property not found" }); return; }

  const contracts = await db.select().from(leaseContractsTable).where(eq(leaseContractsTable.propertyId, propertyId));

  let rentCharged = 0;
  let rentReceived = 0;
  let currency = "KZT";

  for (const c of contracts) {
    const accruals = await db.select().from(accrualsTable).where(
      and(eq(accrualsTable.leaseContractId, c.id), eq(accrualsTable.period, period))
    );
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.leaseContractId, c.id));
    rentCharged += accruals.reduce((s, a) => s + parseFloat(a.amount), 0);
    rentReceived += payments.filter(p => p.paymentDate.startsWith(period)).reduce((s, p) => s + parseFloat(p.amount), 0);
    currency = c.currency;
  }

  const expensesList = await db.select().from(expensesTable).where(eq(expensesTable.propertyId, propertyId));
  const periodExpenses = expensesList.filter(e => e.expenseDate.startsWith(period));
  const expenses = periodExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const netIncome = rentReceived - expenses;

  const [stmt] = await db.insert(ownerStatementsTable).values({
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
