import { Router } from "express";
import { eq, and, ne, SQL } from "drizzle-orm";
import { db, usersTable } from "../lib/db";
import { hashPassword, validatePassword } from "../lib/security";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

// GET /users — список сотрудников своей организации (без super_admin)
router.get("/users", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const conditions: SQL[] = [ne(usersTable.role, "super_admin")];
  if (req.companyId) conditions.push(eq(usersTable.companyId, req.companyId));
  const users = await db.select().from(usersTable)
    .where(and(...conditions))
    .orderBy(usersTable.createdAt);
  const safe = users.map(({ passwordHash: _ph, ...u }) => u);
  res.json(safe);
});

// POST /users — добавить сотрудника в свою организацию
router.post("/users", requireAuth, requireRole("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const { email, password, firstName, lastName, role } = req.body;
  if (!email || !password || !firstName || !lastName || !role) {
    res.status(400).json({ error: "Заполните все обязательные поля" });
    return;
  }
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    res.status(400).json({ error: passwordValidation.error });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Пользователь с таким email уже существует" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: await hashPassword(password),
    firstName,
    lastName,
    role,
    companyId: req.companyId,
    isActive: true,
  }).returning();
  const { passwordHash: _ph, ...safe } = user;
  res.status(201).json(safe);
});

// GET /users/:id
router.get("/users/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const conditions: SQL[] = [eq(usersTable.id, id)];
  if (req.companyId) conditions.push(eq(usersTable.companyId, req.companyId));
  const [user] = await db.select().from(usersTable).where(and(...conditions));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { passwordHash: _ph, ...safe } = user;
  res.json(safe);
});

// PATCH /users/:id
router.patch("/users/:id", requireAuth, requireRole("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { firstName, lastName, role, isActive } = req.body;
  const conditions: SQL[] = [eq(usersTable.id, id)];
  if (req.companyId) conditions.push(eq(usersTable.companyId, req.companyId));
  const [user] = await db.update(usersTable)
    .set({ firstName, lastName, role, isActive })
    .where(and(...conditions)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { passwordHash: _ph, ...safe } = user;
  res.json(safe);
});

// PATCH /users/:id/password — смена пароля сотрудника
router.patch("/users/:id/password", requireAuth, requireRole("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: "Пароль обязателен" });
    return;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    res.status(400).json({ error: passwordValidation.error });
    return;
  }

  const conditions: SQL[] = [eq(usersTable.id, id)];
  if (req.companyId) conditions.push(eq(usersTable.companyId, req.companyId));
  const [user] = await db.update(usersTable)
    .set({ passwordHash: await hashPassword(password) })
    .where(and(...conditions)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// DELETE /users/:id
router.delete("/users/:id", requireAuth, requireRole("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (id === req.userId) {
    res.status(400).json({ error: "Нельзя удалить свой аккаунт" });
    return;
  }
  const conditions: SQL[] = [eq(usersTable.id, id)];
  if (req.companyId) conditions.push(eq(usersTable.companyId, req.companyId));
  await db.delete(usersTable).where(and(...conditions));
  res.sendStatus(204);
});

export default router;
