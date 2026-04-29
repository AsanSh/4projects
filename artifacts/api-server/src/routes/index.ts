import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import companiesRouter from "./companies";
import usersRouter from "./users";
import counterpartiesRouter from "./counterparties";
import propertiesRouter from "./properties";
import contractsRouter from "./contracts";
import documentsRouter from "./documents";
import importRouter from "./import";
import rentalRouter from "./rental";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";
import reportsRouter from "./reports";
import modulesRouter from "./modules";
import investorsRouter from "./investors";
import constructionRouter from "./construction";
import constructionFinanceRouter from "./construction-finance";
import notificationsRouter from "./notifications";
import categoriesRouter from "./categories";
import portalRouter from "./portal";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(companiesRouter);
router.use(usersRouter);
router.use(counterpartiesRouter);
router.use(propertiesRouter);
router.use(contractsRouter);
router.use(documentsRouter);
router.use(importRouter);
router.use(rentalRouter);
router.use(dashboardRouter);
router.use(activityRouter);
router.use(reportsRouter);
router.use(modulesRouter);
router.use("/rental", investorsRouter);
router.use("/construction", constructionRouter);
router.use("/construction", constructionFinanceRouter);
router.use(notificationsRouter);
router.use(categoriesRouter);
router.use(portalRouter);
router.use(adminRouter);

// NBKR exchange rates proxy
router.get("/nbkr/rates", async (_req, res): Promise<void> => {
  try {
    const r = await fetch("https://www.nbkr.kg/XML/daily.xml", { signal: AbortSignal.timeout(5000) });
    const xml = await r.text();
    // Parse currencies from XML
    const rates: Record<string, { name: string; rate: string; scale: string }> = {};
    const regex = /<Currency ISOCode="([^"]+)"[^>]*>[\s\S]*?<Scale>(\d+)<\/Scale>[\s\S]*?<FullName[^>]*>([^<]+)<\/FullName>[\s\S]*?<Value>([\d.]+)<\/Value>[\s\S]*?<\/Currency>/g;
    let m;
    while ((m = regex.exec(xml)) !== null) {
      const [, iso, scale, name, value] = m;
      rates[iso] = { name, scale, rate: value };
    }
    res.json({ date: new Date().toISOString().slice(0, 10), rates });
  } catch {
    // Fallback rates if NBKR is unavailable
    res.json({ date: new Date().toISOString().slice(0, 10), rates: {
      USD: { name: "Доллар США", scale: "1", rate: "87.50" },
      EUR: { name: "Евро", scale: "1", rate: "95.20" },
      RUB: { name: "Российский рубль", scale: "100", rate: "95.40" },
    }});
  }
});

export default router;
