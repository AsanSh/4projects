import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, companiesTable } from "../lib/db";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

// POST /companies — создание новой компании (только суперадмин или новый пользователь без компании)
router.post("/companies", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  // Проверка прав: либо суперадмин, либо у пользователя еще нет привязки к компании
  if (req.companyId && req.userRole !== "super_admin") {
    res.status(403).json({ error: "У вас уже есть привязка к организации" });
    return;
  }

  const { name, legalName, bin, phone, email, address } = req.body;
  if (!name) {
    res.status(400).json({ error: "Название компании обязательно" });
    return;
  }

  try {
    const [company] = await db.insert(companiesTable).values({
      name,
      legalName,
      bin,
      phone,
      email,
      address,
      isActive: true,
    }).returning();

    // Если у пользователя не было компании, привязываем его к новой как администратора
    if (!req.companyId) {
      const { usersTable } = await import("../lib/db/schema");
      await db.update(usersTable)
        .set({ companyId: company.id, role: "admin" })
        .where(eq(usersTable.id, req.userId!));
    }

    res.status(201).json(company);
  } catch (error: any) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Ошибка при создании организации" });
  }
});

// GET /companies — список всех компаний (для суперадмина; обычным пользователям - только своя)
router.get("/companies", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  if (req.companyId) {
    const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, req.companyId));
    res.json(company ? [company] : []);
    return;
  }
  const companies = await db.select().from(companiesTable).orderBy(companiesTable.createdAt);
  res.json(companies);
});

// GET /companies/my — информация о своей организации
router.get("/companies/my", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  if (!req.companyId) {
    res.status(404).json({ error: "Организация не найдена" });
    return;
  }
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, req.companyId));
  if (!company) { res.status(404).json({ error: "Организация не найдена" }); return; }
  res.json(company);
});

// PATCH /companies/my — обновление данных своей организации (только admin)
router.patch("/companies/my", requireAuth, requireRole("admin", "company_admin", "super_admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  if (!req.companyId) {
    res.status(400).json({ error: "Нет привязки к организации" });
    return;
  }
  const { name, legalName, bin, phone, email, address } = req.body;
  const [company] = await db.update(companiesTable)
    .set({ name, legalName, bin, phone, email, address })
    .where(eq(companiesTable.id, req.companyId))
    .returning();
  if (!company) { res.status(404).json({ error: "Организация не найдена" }); return; }
  res.json(company);
});

// GET /companies/:id
router.get("/companies/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (req.companyId && req.companyId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, id));
  if (!company) { res.status(404).json({ error: "Not found" }); return; }
  res.json(company);
});

// PATCH /companies/:id (только своя компания)
router.patch("/companies/:id", requireAuth, requireRole("admin", "company_admin", "super_admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (req.companyId && req.companyId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { name, legalName, bin, phone, email, address, isActive } = req.body;
  const [company] = await db.update(companiesTable)
    .set({ name, legalName, bin, phone, email, address, isActive })
    .where(eq(companiesTable.id, id))
    .returning();
  if (!company) { res.status(404).json({ error: "Not found" }); return; }
  res.json(company);
});

export default router;
