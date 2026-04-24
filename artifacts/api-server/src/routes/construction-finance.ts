import { Router } from "express";
import { db } from "@workspace/db";
import {
  bankAccountsTable, constructionOperationsTable,
  constructionSalesContractsTable, constructionAccrualsTable,
  constructionUnitsTable, constructionProjectsTable,
} from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

// ── Bank Accounts ──────────────────────────────────────────────────────
router.get("/accounts", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const rows = await db.select().from(bankAccountsTable)
    .where(eq(bankAccountsTable.companyId, companyId))
    .orderBy(bankAccountsTable.name);
  res.json(rows);
});

router.post("/accounts", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const [row] = await db.insert(bankAccountsTable).values({ ...req.body, companyId }).returning();
  res.json(row);
});

router.patch("/accounts/:id", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const [row] = await db.update(bankAccountsTable)
    .set(req.body)
    .where(and(eq(bankAccountsTable.id, Number(req.params.id)), eq(bankAccountsTable.companyId, companyId)))
    .returning();
  res.json(row);
});

router.delete("/accounts/:id", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  await db.delete(bankAccountsTable)
    .where(and(eq(bankAccountsTable.id, Number(req.params.id)), eq(bankAccountsTable.companyId, companyId)));
  res.json({ ok: true });
});

// ── Operations ──────────────────────────────────────────────────────────
router.get("/operations", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const rows = await db.select().from(constructionOperationsTable)
    .where(eq(constructionOperationsTable.companyId, companyId))
    .orderBy(desc(constructionOperationsTable.date));
  res.json(rows);
});

router.post("/operations", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const body = req.body;
  const amountKgs = body.currency === "KGS"
    ? body.amount
    : String(parseFloat(body.amount) * parseFloat(body.exchangeRate || "1"));
  const [row] = await db.insert(constructionOperationsTable)
    .values({ ...body, companyId, amountKgs }).returning();
  res.json(row);
});

router.patch("/operations/:id", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const [row] = await db.update(constructionOperationsTable)
    .set(req.body)
    .where(and(eq(constructionOperationsTable.id, Number(req.params.id)), eq(constructionOperationsTable.companyId, companyId)))
    .returning();
  res.json(row);
});

router.delete("/operations/:id", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  await db.delete(constructionOperationsTable)
    .where(and(eq(constructionOperationsTable.id, Number(req.params.id)), eq(constructionOperationsTable.companyId, companyId)));
  res.json({ ok: true });
});

// ── Sales Contracts ─────────────────────────────────────────────────────
router.get("/contracts-sales", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const rows = await db.select().from(constructionSalesContractsTable)
    .where(eq(constructionSalesContractsTable.companyId, companyId))
    .orderBy(desc(constructionSalesContractsTable.createdAt));
  res.json(rows);
});

router.post("/contracts-sales", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const body = req.body;
  const remainingAmount = String(parseFloat(body.totalAmount || "0") - parseFloat(body.downPayment || "0"));

  // Generate contract number
  const count = await db.select({ cnt: sql<number>`count(*)` })
    .from(constructionSalesContractsTable)
    .where(eq(constructionSalesContractsTable.companyId, companyId));
  const num = (Number(count[0].cnt) + 1).toString().padStart(4, "0");
  const contractNumber = `ДКП-${new Date().getFullYear()}-${num}`;

  const [row] = await db.insert(constructionSalesContractsTable)
    .values({ ...body, companyId, remainingAmount, contractNumber }).returning();

  // If unit is specified, mark it as reserved
  if (body.unitId) {
    await db.update(constructionUnitsTable)
      .set({ status: "reserved" })
      .where(and(eq(constructionUnitsTable.id, Number(body.unitId)), eq(constructionUnitsTable.companyId, companyId)));
  }

  res.json(row);
});

router.patch("/contracts-sales/:id", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const body = req.body;

  // If status changed to signed, mark unit as sold
  if (body.status === "signed" || body.status === "completed") {
    const [contract] = await db.select().from(constructionSalesContractsTable)
      .where(and(eq(constructionSalesContractsTable.id, Number(req.params.id)), eq(constructionSalesContractsTable.companyId, companyId)));
    if (contract?.unitId) {
      await db.update(constructionUnitsTable)
        .set({ status: "sold" })
        .where(and(eq(constructionUnitsTable.id, contract.unitId), eq(constructionUnitsTable.companyId, companyId)));
    }
  }

  const [row] = await db.update(constructionSalesContractsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(constructionSalesContractsTable.id, Number(req.params.id)), eq(constructionSalesContractsTable.companyId, companyId)))
    .returning();
  res.json(row);
});

router.delete("/contracts-sales/:id", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  await db.delete(constructionSalesContractsTable)
    .where(and(eq(constructionSalesContractsTable.id, Number(req.params.id)), eq(constructionSalesContractsTable.companyId, companyId)));
  res.json({ ok: true });
});

// Generate payment schedule for a contract
router.post("/contracts-sales/:id/generate-schedule", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const [contract] = await db.select().from(constructionSalesContractsTable)
    .where(and(eq(constructionSalesContractsTable.id, Number(req.params.id)), eq(constructionSalesContractsTable.companyId, companyId)));
  if (!contract) return res.status(404).json({ error: "Договор не найден" });

  const installments = contract.installmentMonths || 1;
  const totalRemaining = parseFloat(contract.remainingAmount?.toString() || "0");
  const monthlyPayment = totalRemaining / installments;
  const startDate = contract.contractDate || new Date().toISOString().slice(0, 10);

  // Delete existing schedule
  await db.delete(constructionAccrualsTable)
    .where(and(eq(constructionAccrualsTable.contractId, contract.id), eq(constructionAccrualsTable.companyId, companyId)));

  const accruals = [];
  for (let i = 0; i < installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    const isLast = i === installments - 1;
    const amount = isLast ? totalRemaining - monthlyPayment * (installments - 1) : monthlyPayment;
    accruals.push({
      companyId,
      contractId: contract.id,
      projectId: contract.projectId,
      installmentNumber: i + 1,
      dueDate: dueDate.toISOString().slice(0, 10),
      amount: String(Math.round(amount)),
      paidAmount: "0",
      remainingAmount: String(Math.round(amount)),
      status: "pending",
      currency: contract.currency || "KGS",
    });
  }

  const rows = await db.insert(constructionAccrualsTable).values(accruals).returning();
  res.json(rows);
});

// ── Accruals ────────────────────────────────────────────────────────────
router.get("/accruals", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const { contractId, projectId } = req.query;
  let query = db.select().from(constructionAccrualsTable)
    .where(eq(constructionAccrualsTable.companyId, companyId));
  const rows = await db.select().from(constructionAccrualsTable)
    .where(
      contractId
        ? and(eq(constructionAccrualsTable.companyId, companyId), eq(constructionAccrualsTable.contractId, Number(contractId)))
        : eq(constructionAccrualsTable.companyId, companyId)
    )
    .orderBy(constructionAccrualsTable.dueDate);
  res.json(rows);
});

router.patch("/accruals/:id", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const [row] = await db.update(constructionAccrualsTable)
    .set(req.body)
    .where(and(eq(constructionAccrualsTable.id, Number(req.params.id)), eq(constructionAccrualsTable.companyId, companyId)))
    .returning();
  res.json(row);
});

// ── Cashier — accept payment ────────────────────────────────────────────
router.post("/cashier/payment", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const { contractId, accrualId, amount, currency, exchangeRate, accountId, paymentMethod, date, notes } = req.body;

  // 1. Record operation
  const amountKgs = currency === "KGS" ? amount : String(parseFloat(amount) * parseFloat(exchangeRate || "1"));
  const [op] = await db.insert(constructionOperationsTable).values({
    companyId,
    projectId: req.body.projectId,
    type: "income",
    category: "Платеж по договору",
    contractId,
    fromAccountId: null,
    toAccountId: accountId ? Number(accountId) : null,
    amount,
    currency: currency || "KGS",
    exchangeRate: exchangeRate || "1",
    amountKgs,
    date: date || new Date().toISOString().slice(0, 10),
    description: `Оплата по договору #${contractId}`,
    paymentMethod: paymentMethod || "cash",
    status: "approved",
    notes,
  }).returning();

  // 2. Update accrual if provided
  if (accrualId) {
    const [accrual] = await db.select().from(constructionAccrualsTable)
      .where(and(eq(constructionAccrualsTable.id, Number(accrualId)), eq(constructionAccrualsTable.companyId, companyId)));
    if (accrual) {
      const newPaid = parseFloat(accrual.paidAmount?.toString() || "0") + parseFloat(amount);
      const newRemaining = Math.max(0, parseFloat(accrual.amount?.toString() || "0") - newPaid);
      const status = newRemaining <= 0 ? "paid" : "partial";
      await db.update(constructionAccrualsTable).set({
        paidAmount: String(newPaid),
        remainingAmount: String(newRemaining),
        status,
        paidAt: newRemaining <= 0 ? (date || new Date().toISOString().slice(0, 10)) : undefined,
      }).where(eq(constructionAccrualsTable.id, Number(accrualId)));
    }
  }

  // 3. Update contract paid amount
  if (contractId) {
    const [contract] = await db.select().from(constructionSalesContractsTable)
      .where(and(eq(constructionSalesContractsTable.id, Number(contractId)), eq(constructionSalesContractsTable.companyId, companyId)));
    if (contract) {
      const newPaid = parseFloat(contract.paidAmount?.toString() || "0") + parseFloat(amount);
      const newRemaining = Math.max(0, parseFloat(contract.totalAmount?.toString() || "0") - newPaid);
      await db.update(constructionSalesContractsTable).set({
        paidAmount: String(newPaid),
        remainingAmount: String(newRemaining),
        status: newRemaining <= 0 ? "completed" : "signed",
        updatedAt: new Date(),
      }).where(eq(constructionSalesContractsTable.id, Number(contractId)));
    }
  }

  res.json({ ok: true, operation: op });
});

// ── Analytics ───────────────────────────────────────────────────────────
router.get("/analytics/cashflow", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const { year = new Date().getFullYear() } = req.query;

  const rows = await db.select({
    month: sql<string>`to_char(date::date, 'YYYY-MM')`,
    type: constructionOperationsTable.type,
    total: sql<number>`sum(amount_kgs::numeric)`,
  }).from(constructionOperationsTable)
    .where(and(
      eq(constructionOperationsTable.companyId, companyId),
      sql`extract(year from date::date) = ${year}`
    ))
    .groupBy(sql`to_char(date::date, 'YYYY-MM')`, constructionOperationsTable.type)
    .orderBy(sql`to_char(date::date, 'YYYY-MM')`);

  res.json(rows);
});

router.get("/analytics/debt", async (req, res) => {
  const companyId = (req as any).user?.companyId;
  const rows = await db.select().from(constructionAccrualsTable)
    .where(and(
      eq(constructionAccrualsTable.companyId, companyId),
      sql`status != 'paid'`
    ))
    .orderBy(constructionAccrualsTable.dueDate);
  res.json(rows);
});

router.get("/analytics/summary", async (req, res) => {
  const companyId = (req as any).user?.companyId;

  const [opStats] = await db.select({
    totalIncome: sql<number>`sum(case when type='income' then amount_kgs::numeric else 0 end)`,
    totalExpense: sql<number>`sum(case when type='expense' then amount_kgs::numeric else 0 end)`,
  }).from(constructionOperationsTable).where(eq(constructionOperationsTable.companyId, companyId));

  const [contractStats] = await db.select({
    totalContracts: sql<number>`count(*)`,
    totalAmount: sql<number>`sum(total_amount::numeric)`,
    totalPaid: sql<number>`sum(paid_amount::numeric)`,
    totalRemaining: sql<number>`sum(remaining_amount::numeric)`,
  }).from(constructionSalesContractsTable).where(eq(constructionSalesContractsTable.companyId, companyId));

  res.json({ opStats, contractStats });
});

export default router;
