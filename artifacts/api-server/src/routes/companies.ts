import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, companiesTable } from "@workspace/db";

const router: ReturnType<typeof Router> = Router();

router.get("/companies", async (_req, res): Promise<void> => {
  const companies = await db.select().from(companiesTable).orderBy(companiesTable.createdAt);
  res.json(companies);
});

router.post("/companies", async (req, res): Promise<void> => {
  const { name, legalName, bin, phone, email, address } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const [company] = await db.insert(companiesTable).values({ name, legalName, bin, phone, email, address }).returning();
  res.status(201).json(company);
});

router.get("/companies/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, id));
  if (!company) { res.status(404).json({ error: "Not found" }); return; }
  res.json(company);
});

router.patch("/companies/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, legalName, bin, phone, email, address, isActive } = req.body;
  const [company] = await db.update(companiesTable).set({ name, legalName, bin, phone, email, address, isActive }).where(eq(companiesTable.id, id)).returning();
  if (!company) { res.status(404).json({ error: "Not found" }); return; }
  res.json(company);
});

export default router;
