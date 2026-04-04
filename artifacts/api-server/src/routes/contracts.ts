import { Router } from "express";
import { eq, and, SQL } from "drizzle-orm";
import { db, contractsTable, counterpartiesTable, propertiesTable } from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

router.get("/contracts", async (req, res): Promise<void> => {
  const { type, counterpartyId, propertyId, status } = req.query as Record<string, string | undefined>;
  const conditions: SQL[] = [];
  if (type) conditions.push(eq(contractsTable.type, type));
  if (counterpartyId) conditions.push(eq(contractsTable.counterpartyId, parseInt(counterpartyId, 10)));
  if (propertyId) conditions.push(eq(contractsTable.propertyId, parseInt(propertyId, 10)));
  if (status) conditions.push(eq(contractsTable.status, status));

  const rows = conditions.length
    ? await db.select().from(contractsTable).where(and(...conditions)).orderBy(contractsTable.createdAt)
    : await db.select().from(contractsTable).orderBy(contractsTable.createdAt);

  const enriched = await Promise.all(rows.map(async (c) => {
    let counterpartyName = null;
    let propertyUnitNumber = null;
    if (c.counterpartyId) {
      const [cp] = await db.select().from(counterpartiesTable).where(eq(counterpartiesTable.id, c.counterpartyId));
      counterpartyName = cp?.fullName ?? null;
    }
    if (c.propertyId) {
      const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, c.propertyId));
      propertyUnitNumber = p?.unitNumber ?? null;
    }
    return { ...c, counterpartyName, propertyUnitNumber };
  }));

  res.json(enriched);
});

router.post("/contracts", async (req, res): Promise<void> => {
  const { contractNumber, contractDate, type, counterpartyId, propertyId, amount, currency, startDate, endDate, accrualDate, deposit, status, comment } = req.body;
  if (!contractNumber || !type || !status) {
    res.status(400).json({ error: "contractNumber, type, status required" });
    return;
  }
  const [row] = await db.insert(contractsTable).values({ contractNumber, contractDate, type, counterpartyId, propertyId, amount, currency, startDate, endDate, accrualDate, deposit, status, comment }).returning();
  res.status(201).json({ ...row, counterpartyName: null, propertyUnitNumber: null });
});

router.get("/contracts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.select().from(contractsTable).where(eq(contractsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, counterpartyName: null, propertyUnitNumber: null });
});

router.patch("/contracts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { contractNumber, contractDate, type, counterpartyId, propertyId, amount, currency, startDate, endDate, accrualDate, deposit, status, comment } = req.body;
  const [row] = await db.update(contractsTable).set({ contractNumber, contractDate, type, counterpartyId, propertyId, amount, currency, startDate, endDate, accrualDate, deposit, status, comment }).where(eq(contractsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, counterpartyName: null, propertyUnitNumber: null });
});

router.delete("/contracts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(contractsTable).where(eq(contractsTable.id, id));
  res.sendStatus(204);
});

export default router;
