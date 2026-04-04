import { Router } from "express";
import { eq, count, sql } from "drizzle-orm";
import {
  db, propertiesTable, tenantsTable, leaseContractsTable, contractsTable,
  counterpartiesTable, accrualsTable, paymentsTable, activityLogTable
} from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const allProps = await db.select().from(propertiesTable);
  const totalProperties = allProps.length;
  const rentedProperties = allProps.filter(p => p.rentalStatus === "rented").length;
  const freeProperties = allProps.filter(p => p.rentalStatus === "free" || !p.rentalStatus).length;
  const overdueProperties = allProps.filter(p => p.rentalStatus === "overdue").length;

  const tenants = await db.select().from(tenantsTable);
  const totalTenants = tenants.filter(t => t.status === "active").length;

  const leaseContracts = await db.select().from(leaseContractsTable);
  const activeLease = leaseContracts.filter(c => c.status === "active").length;

  const contracts = await db.select().from(contractsTable);
  const totalContractsActive = contracts.filter(c => c.status === "active").length;

  const counterparties = await db.select().from(counterpartiesTable);
  const totalCounterparties = counterparties.length;

  // Monthly rent calculations (current month)
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const accruals = await db.select().from(accrualsTable).where(eq(accrualsTable.period, currentPeriod));
  const monthlyRentCharged = accruals.reduce((s, a) => s + parseFloat(a.amount), 0);
  const monthlyRentReceived = accruals.reduce((s, a) => s + parseFloat(a.paidAmount), 0);

  const allAccruals = await db.select().from(accrualsTable);
  const outstandingBalance = allAccruals.reduce((s, a) => s + parseFloat(a.balance), 0);

  res.json({
    totalProperties,
    rentedProperties,
    freeProperties,
    overdueProperties,
    totalTenants,
    activeLease,
    totalContractsActive,
    totalCounterparties,
    monthlyRentCharged,
    monthlyRentReceived,
    outstandingBalance,
    currency: "KZT",
  });
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const rows = await db.select().from(activityLogTable).orderBy(sql`${activityLogTable.createdAt} desc`).limit(limit);
  res.json(rows);
});

router.get("/dashboard/rental-overview", async (_req, res): Promise<void> => {
  const props = await db.select().from(propertiesTable);

  const statusCounts: Record<string, number> = {};
  for (const p of props) {
    const s = p.rentalStatus || "free";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // Top debtors
  const allAccruals = await db.select().from(accrualsTable);
  const contractIds = [...new Set(allAccruals.map(a => a.leaseContractId))];
  
  const debtorMap = new Map<number, number>();
  for (const cid of contractIds) {
    const total = allAccruals.filter(a => a.leaseContractId === cid).reduce((s, a) => s + parseFloat(a.balance), 0);
    if (total > 0) debtorMap.set(cid, total);
  }

  const topDebtors = [];
  for (const [cid, balance] of [...debtorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    const [contract] = await db.select().from(leaseContractsTable).where(eq(leaseContractsTable.id, cid));
    if (!contract) continue;
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, contract.tenantId));
    topDebtors.push({ tenantName: tenant?.fullName ?? "Unknown", balance, currency: contract.currency });
  }

  // Recent payments
  const payments = await db.select().from(paymentsTable).orderBy(sql`${paymentsTable.createdAt} desc`).limit(5);
  const recentPayments = await Promise.all(payments.map(async (p) => {
    const [contract] = await db.select().from(leaseContractsTable).where(eq(leaseContractsTable.id, p.leaseContractId));
    const [tenant] = contract ? await db.select().from(tenantsTable).where(eq(tenantsTable.id, contract.tenantId)) : [];
    return {
      id: p.id,
      tenantName: tenant?.fullName ?? "Unknown",
      amount: parseFloat(p.amount),
      currency: p.currency,
      paymentDate: p.paymentDate,
    };
  }));

  res.json({ byStatus, topDebtors, recentPayments });
});

export default router;
