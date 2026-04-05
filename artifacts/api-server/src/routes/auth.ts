import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, companiesTable, sessionsTable } from "@workspace/db";
import { createHash } from "crypto";

const router: ReturnType<typeof Router> = Router();

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "proptech_salt").digest("hex");
}

/** Для обратной совместимости — middleware auth.ts по-прежнему может читать sessions */
export const sessions = new Map<string, number>();

function generateToken(): string {
  return createHash("sha256").update(Math.random().toString() + Date.now().toString()).digest("hex");
}

/** Создаёт сессию в БД и возвращает токен */
async function createSession(userId: number): Promise<string> {
  const token = generateToken();
  await db.insert(sessionsTable).values({ token, userId });
  return token;
}

/** Ищет userId по токену в БД */
export async function getSessionUserId(token: string): Promise<number | null> {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  return session?.userId ?? null;
}

// POST /auth/register — создание организации + admin пользователя
router.post("/auth/register", async (req, res): Promise<void> => {
  const { companyName, legalName, bin, phone, email, address, firstName, lastName, password } = req.body;

  if (!companyName || !email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "Заполните все обязательные поля" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Пароль должен быть не менее 6 символов" });
    return;
  }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingUser) {
    res.status(409).json({ error: "Пользователь с таким email уже зарегистрирован" });
    return;
  }

  // Создаём организацию
  const [company] = await db.insert(companiesTable).values({
    name: companyName,
    legalName: legalName || null,
    bin: bin || null,
    phone: phone || null,
    email,
    address: address || null,
    isActive: true,
  }).returning();

  // Создаём admin пользователя организации
  const [user] = await db.insert(usersTable).values({
    companyId: company.id,
    email,
    passwordHash: hashPassword(password),
    firstName,
    lastName,
    role: "admin",
    isActive: true,
  }).returning();

  const token = await createSession(user.id);

  const { passwordHash: _ph, ...safeUser } = user;
  res.status(201).json({ token, user: safeUser, company });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email и пароль обязательны" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Аккаунт заблокирован. Обратитесь к администратору." });
    return;
  }

  const token = await createSession(user.id);

  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// POST /auth/logout
router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.json({ message: "Logged out" });
});

// GET /auth/me
router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = authHeader.slice(7);
  const userId = await getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let company = null;
  if (user.companyId) {
    const [comp] = await db.select().from(companiesTable).where(eq(companiesTable.id, user.companyId));
    company = comp || null;
  }

  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ ...safeUser, company });
});

// PATCH /auth/me — обновление собственного профиля
router.patch("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = authHeader.slice(7);
  const userId = sessions.get(token);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { firstName, lastName, password } = req.body;
  const updates: Record<string, unknown> = {};

  if (firstName !== undefined) {
    if (!firstName.trim()) { res.status(400).json({ error: "Имя не может быть пустым" }); return; }
    updates.firstName = firstName.trim();
  }
  if (lastName !== undefined) {
    if (!lastName.trim()) { res.status(400).json({ error: "Фамилия не может быть пустой" }); return; }
    updates.lastName = lastName.trim();
  }
  if (password !== undefined) {
    if (password.length < 6) { res.status(400).json({ error: "Пароль должен быть не менее 6 символов" }); return; }
    updates.passwordHash = hashPassword(password);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Нет данных для обновления" });
    return;
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!user) { res.status(404).json({ error: "Пользователь не найден" }); return; }

  const { passwordHash: _ph, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
