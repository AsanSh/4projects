import { Router } from "express";
import { eq, and, SQL, gte, lte, sql, inArray } from "drizzle-orm";
import {
  db, leaseContractsTable, accrualsTable, paymentsTable,
  tenantsTable, propertiesTable, expensesTable, paymentAllocationsTable
} from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

// GET /reports/debt — задолженности арендаторов
router.get("/reports/debt", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const cid = req.companyId;
  const conditions: SQL[] = [];
  if (cid) conditions.push(eq(accrualsTable.companyId, cid));
  conditions.push(sql`${accrualsTable.balance} > 0`);

  const rows = await db.select({
    accrual: accrualsTable,
    contract: leaseContractsTable,
    tenant: tenantsTable,
    prop: propertiesTable,
  })
    .from(accrualsTable)
    .innerJoin(leaseContractsTable, eq(accrualsTable.leaseContractId, leaseContractsTable.id))
    .leftJoin(tenantsTable, eq(leaseContractsTable.tenantId, tenantsTable.id))
    .leftJoin(propertiesTable, eq(leaseContractsTable.propertyId, propertiesTable.id))
    .where(and(...conditions))
    .orderBy(accrualsTable.dueDate);

  const byContract = new Map<number, {
    contractId: number;
    tenantName: string;
    propertyUnitNumber: string;
    totalDebt: number;
    overdueDebt: number;
    currency: string;
    periods: string[];
  }>();

  const today = new Date().toISOString().split("T")[0];

  for (const row of rows) {
    const a = row.accrual;
    const contract = row.contract;
    const tenant = row.tenant;
    const prop = row.prop;

    const key = a.leaseContractId;
    if (!byContract.has(key)) {
      byContract.set(key, {
        contractId: key,
        tenantName: tenant?.fullName ?? "—",
        propertyUnitNumber: prop?.unitNumber ?? "—",
        totalDebt: 0,
        overdueDebt: 0,
        currency: contract.currency,
        periods: [],
      });
    }
    const entry = byContract.get(key)!;
    const balance = parseFloat(a.balance);
    entry.totalDebt += balance;
    if (a.dueDate <= today) entry.overdueDebt += balance;
    entry.periods.push(a.period);
  }

  res.json({
    summary: {
      totalDebtors: byContract.size,
      totalDebt: [...byContract.values()].reduce((s, v) => s + v.totalDebt, 0),
      totalOverdue: [...byContract.values()].reduce((s, v) => s + v.overdueDebt, 0),
    },
    rows: [...byContract.values()],
  });
});

// GET /reports/rental-summary — сводка по аренде за период
router.get("/reports/rental-summary", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const cid = req.companyId;
  const { from, to, contractId } = req.query as Record<string, string | undefined>;

  const accrualConditions: SQL[] = [];
  if (cid) accrualConditions.push(eq(accrualsTable.companyId, cid));
  if (from) accrualConditions.push(sql`${accrualsTable.period} >= ${from}`);
  if (to) accrualConditions.push(sql`${accrualsTable.period} <= ${to}`);
  if (contractId) accrualConditions.push(eq(accrualsTable.leaseContractId, parseInt(contractId, 10)));

  const accruals = await db.select().from(accrualsTable)
    .where(accrualConditions.length ? and(...accrualConditions) : undefined);

  const paymentConditions: SQL[] = [];
  if (cid) paymentConditions.push(eq(paymentsTable.companyId, cid));
  if (from) paymentConditions.push(sql`${paymentsTable.paymentDate} >= ${from}`);
  if (to) paymentConditions.push(sql`${paymentsTable.paymentDate} <= ${to}`);
  if (contractId) paymentConditions.push(eq(paymentsTable.leaseContractId, parseInt(contractId, 10)));

  const payments = await db.select().from(paymentsTable)
    .where(paymentConditions.length ? and(...paymentConditions) : undefined);

  const totalCharged = accruals.reduce((s, a) => s + parseFloat(a.amount), 0);
  const totalDiscount = accruals.reduce((s, a) => s + parseFloat(a.discountAmount ?? "0"), 0);
  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalBalance = accruals.reduce((s, a) => s + parseFloat(a.balance), 0);

  // By month breakdown
  const byMonth = new Map<string, { charged: number; paid: number; balance: number; count: number }>();
  for (const a of accruals) {
    const entry = byMonth.get(a.period) ?? { charged: 0, paid: 0, balance: 0, count: 0 };
    entry.charged += parseFloat(a.amount);
    entry.balance += parseFloat(a.balance);
    entry.count++;
    byMonth.set(a.period, entry);
  }
  for (const p of payments) {
    const period = p.paymentDate.slice(0, 7);
    const entry = byMonth.get(period) ?? { charged: 0, paid: 0, balance: 0, count: 0 };
    entry.paid += parseFloat(p.amount);
    byMonth.set(period, entry);
  }

  const byMonthRows = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({ period, ...v }));

  res.json({
    summary: { totalCharged, totalDiscount, totalPaid, totalBalance, collectionRate: totalCharged ? Math.round((totalPaid / totalCharged) * 100) : 0 },
    byMonth: byMonthRows,
  });
});

// GET /reports/cashflow — денежный поток (платежи + расходы)
router.get("/reports/cashflow", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const cid = req.companyId;
  const { from, to } = req.query as Record<string, string | undefined>;

  const payConditions: SQL[] = [];
  if (cid) payConditions.push(eq(paymentsTable.companyId, cid));
  if (from) payConditions.push(sql`${paymentsTable.paymentDate} >= ${from}`);
  if (to) payConditions.push(sql`${paymentsTable.paymentDate} <= ${to}`);

  const expConditions: SQL[] = [];
  if (cid) expConditions.push(eq(expensesTable.companyId, cid));
  if (from) expConditions.push(sql`${expensesTable.expenseDate} >= ${from}`);
  if (to) expConditions.push(sql`${expensesTable.expenseDate} <= ${to}`);

  const [payments, expenses] = await Promise.all([
    db.select().from(paymentsTable).where(payConditions.length ? and(...payConditions) : undefined).orderBy(paymentsTable.paymentDate),
    db.select().from(expensesTable).where(expConditions.length ? and(...expConditions) : undefined).orderBy(expensesTable.expenseDate),
  ]);

  const totalInflow = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalOutflow = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  // By month
  const byMonth = new Map<string, { inflow: number; outflow: number; net: number }>();
  for (const p of payments) {
    const m = p.paymentDate.slice(0, 7);
    const e = byMonth.get(m) ?? { inflow: 0, outflow: 0, net: 0 };
    e.inflow += parseFloat(p.amount);
    e.net = e.inflow - e.outflow;
    byMonth.set(m, e);
  }
  for (const exp of expenses) {
    const m = exp.expenseDate.slice(0, 7);
    const e = byMonth.get(m) ?? { inflow: 0, outflow: 0, net: 0 };
    e.outflow += parseFloat(exp.amount);
    e.net = e.inflow - e.outflow;
    byMonth.set(m, e);
  }

  const byMonthRows = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({ period, ...v }));

  res.json({
    summary: { totalInflow, totalOutflow, netCashflow: totalInflow - totalOutflow },
    byMonth: byMonthRows,
    recentPayments: payments.slice(-10).reverse(),
    recentExpenses: expenses.slice(-10).reverse(),
  });
});

// GET /reports/payments — история платежей с деталями
router.get("/reports/payments", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const cid = req.companyId;
  const { from, to, contractId } = req.query as Record<string, string | undefined>;

  const conditions: SQL[] = [];
  if (cid) conditions.push(eq(paymentsTable.companyId, cid));
  if (from) conditions.push(sql`${paymentsTable.paymentDate} >= ${from}`);
  if (to) conditions.push(sql`${paymentsTable.paymentDate} <= ${to}`);
  if (contractId) conditions.push(eq(paymentsTable.leaseContractId, parseInt(contractId, 10)));

  const rows = await db.select({
    payment: paymentsTable,
    contract: leaseContractsTable,
    tenant: tenantsTable,
    prop: propertiesTable,
  })
    .from(paymentsTable)
    .leftJoin(leaseContractsTable, eq(paymentsTable.leaseContractId, leaseContractsTable.id))
    .leftJoin(tenantsTable, eq(leaseContractsTable.tenantId, tenantsTable.id))
    .leftJoin(propertiesTable, eq(leaseContractsTable.propertyId, propertiesTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(paymentsTable.paymentDate);

  if (rows.length === 0) {
    return void res.json({ total: 0, count: 0, rows: [] });
  }

  const paymentIds = rows.map(r => r.payment.id);
  const allAllocs = await db.select().from(paymentAllocationsTable).where(inArray(paymentAllocationsTable.paymentId, paymentIds));

  const allocsByPayment = new Map<number, typeof allAllocs>();
  for (const a of allAllocs) {
    if (!allocsByPayment.has(a.paymentId)) allocsByPayment.set(a.paymentId, []);
    allocsByPayment.get(a.paymentId)!.push(a);
  }

  const enriched = rows.map((r) => {
    const p = r.payment;
    const contract = r.contract;
    const tenant = r.tenant;
    const prop = r.prop;
    const allocs = allocsByPayment.get(p.id) ?? [];

    return {
      ...p,
      amount: parseFloat(p.amount),
      tenantName: tenant?.fullName ?? "—",
      propertyUnitNumber: prop?.unitNumber ?? "—",
      contractNumber: contract?.contractNumber ?? "—",
      allocations: allocs.map(a => ({ ...a, amount: parseFloat(a.amount) })),
    };
  });

  const total = enriched.reduce((s, p) => s + p.amount, 0);
  res.json({ total, count: enriched.length, rows: enriched });
});

// GET /reports/counterparties — активность контрагентов
router.get("/reports/counterparties", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const cid = req.companyId;

  const tenantConditions: SQL[] = [];
  if (cid) tenantConditions.push(eq(tenantsTable.companyId, cid));
  const tenants = await db.select().from(tenantsTable).where(tenantConditions.length ? and(...tenantConditions) : undefined);

  if (tenants.length === 0) return void res.json([]);

  const tenantIds = tenants.map(t => t.id);
  const contractConditions: SQL[] = [inArray(leaseContractsTable.tenantId, tenantIds)];
  if (cid) contractConditions.push(eq(leaseContractsTable.companyId, cid));
  const allContracts = await db.select().from(leaseContractsTable).where(and(...contractConditions));

  if (allContracts.length === 0) {
    return void res.json(tenants.map(t => ({
      id: t.id,
      fullName: t.fullName,
      status: t.status,
      contractsCount: 0,
      activeContracts: 0,
      totalPaid: 0,
      totalBalance: 0,
    })));
  }

  const contractIds = allContracts.map(c => c.id);
  const [allPayments, allAccruals] = await Promise.all([
    db.select().from(paymentsTable).where(inArray(paymentsTable.leaseContractId, contractIds)),
    db.select().from(accrualsTable).where(inArray(accrualsTable.leaseContractId, contractIds)),
  ]);

  const contractsByTenant = new Map<number, typeof allContracts>();
  for (const c of allContracts) {
    if (!contractsByTenant.has(c.tenantId)) contractsByTenant.set(c.tenantId, []);
    contractsByTenant.get(c.tenantId)!.push(c);
  }

  const paymentsByContract = new Map<number, typeof allPayments>();
  for (const p of allPayments) {
    if (!paymentsByContract.has(p.leaseContractId)) paymentsByContract.set(p.leaseContractId, []);
    paymentsByContract.get(p.leaseContractId)!.push(p);
  }

  const accrualsByContract = new Map<number, typeof allAccruals>();
  for (const a of allAccruals) {
    if (!accrualsByContract.has(a.leaseContractId)) accrualsByContract.set(a.leaseContractId, []);
    accrualsByContract.get(a.leaseContractId)!.push(a);
  }

  const result = tenants.map((t) => {
    const contracts = contractsByTenant.get(t.id) ?? [];
    let totalPaid = 0, totalBalance = 0;

    for (const c of contracts) {
      const payments = paymentsByContract.get(c.id) ?? [];
      const accruals = accrualsByContract.get(c.id) ?? [];
      totalPaid += payments.reduce((s, p) => s + parseFloat(p.amount), 0);
      totalBalance += accruals.reduce((s, a) => s + parseFloat(a.balance), 0);
    }

    return {
      id: t.id,
      fullName: t.fullName,
      status: t.status,
      contractsCount: contracts.length,
      activeContracts: contracts.filter(c => c.status === "active").length,
      totalPaid,
      totalBalance,
    };
  });

  res.json(result);
});

export default router;
