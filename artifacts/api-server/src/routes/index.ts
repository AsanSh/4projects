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

export default router;
