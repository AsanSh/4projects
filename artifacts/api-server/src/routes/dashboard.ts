import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import {
  db, propertiesTable, tenantsTable, leaseContractsTable, contractsTable,
  counterpartiesTable, accrualsTable, paymentsTable, activityLogTable
} from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

router.get("/dashboard/summary", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const cid = req.companyId;

  const allProps = cid
    ? await db.select().from(propertiesTable).where(eq(propertiesTable.companyId, cid))
    : await db.select().from(propertiesTable);
  const totalProperties = allProps.length;
  const rentedProperties = allProps.filter(p => p.rentalStatus === "rented").length;
  const freeProperties = allProps.filter(p => p.rentalStatus === "free" || !p.rentalStatus).length;
  const overdueProperties = allProps.filter(p => p.rentalStatus === "overdue").length;

  const tenants = cid
    ? await db.select().from(tenantsTable).where(eq(tenantsTable.companyId, cid))
    : await db.select().from(tenantsTable);
  const totalTenants = tenants.filter(t => t.status === "active").length;

  const leaseContracts = cid
    ? await db.select().from(leaseContractsTable).where(eq(leaseContractsTable.companyId, cid))
    : await db.select().from(leaseContractsTable);
  const activeLease = leaseContracts.filter(c => c.status === "active").length;

  const contracts = cid
    ? await db.select().from(contractsTable).where(eq(contractsTable.companyId, cid))
    : await db.select().from(contractsTable);
  const totalContractsActive = contracts.filter(c => c.status === "active").length;

  const counterparties = cid
    ? await db.select().from(counterpartiesTable).where(eq(counterpartiesTable.companyId, cid))
    : await db.select().from(counterpartiesTable);
  const totalCounterparties = counterparties.length;

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const accruals = cid
    ? await db.select().from(accrualsTable).where(eq(accrualsTable.companyId, cid))
    : await db.select().from(accrualsTable);
  const monthlyAccruals = accruals.filter(a => a.period === currentPeriod);
  const monthlyRentCharged = monthlyAccruals.reduce((s, a) => s + parseFloat(a.amount), 0);
  const monthlyRentReceived = monthlyAccruals.reduce((s, a) => s + parseFloat(a.paidAmount), 0);
  const outstandingBalance = accruals.reduce((s, a) => s + parseFloat(a.balance), 0);

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
    currency: "KGS",
  });
});

router.get("/dashboard/activity", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const cid = req.companyId;
  const rows = cid
    ? await db.select().from(activityLogTable).where(eq(activityLogTable.companyId, cid)).orderBy(sql`${activityLogTable.createdAt} desc`).limit(limit)
    : await db.select().from(activityLogTable).orderBy(sql`${activityLogTable.createdAt} desc`).limit(limit);
  res.json(rows);
});

router.get("/dashboard/rental-overview", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const cid = req.companyId;

  const props = cid
    ? await db.select().from(propertiesTable).where(eq(propertiesTable.companyId, cid))
    : await db.select().from(propertiesTable);

  const statusCounts: Record<string, number> = {};
  for (const p of props) {
    const s = p.rentalStatus || "free";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  const allAccruals = cid
    ? await db.select().from(accrualsTable).where(eq(accrualsTable.companyId, cid))
    : await db.select().from(accrualsTable);

  const contractIds = [...new Set(allAccruals.map(a => a.leaseContractId))];
  const debtorMap = new Map<number, number>();
  for (const contractId of contractIds) {
    const total = allAccruals.filter(a => a.leaseContractId === contractId).reduce((s, a) => s + parseFloat(a.balance), 0);
    if (total > 0) debtorMap.set(contractId, total);
  }

  const topDebtors = [];
  for (const [contractId, balance] of [...debtorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    const [contract] = await db.select().from(leaseContractsTable).where(eq(leaseContractsTable.id, contractId));
    if (!contract) continue;
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, contract.tenantId));
    topDebtors.push({ tenantName: tenant?.fullName ?? "Unknown", balance, currency: contract.currency });
  }

  const payments = cid
    ? await db.select().from(paymentsTable).where(eq(paymentsTable.companyId, cid)).orderBy(sql`${paymentsTable.createdAt} desc`).limit(5)
    : await db.select().from(paymentsTable).orderBy(sql`${paymentsTable.createdAt} desc`).limit(5);

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
