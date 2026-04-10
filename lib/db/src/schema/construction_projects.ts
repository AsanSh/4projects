import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const constructionProjectsTable = pgTable("construction_projects", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  name: text("name").notNull(),
  address: text("address"),
  region: text("region"),
  status: text("status").notNull().default("planning"),

  // Building characteristics
  buildingType: text("building_type").notNull().default("apartment"),
  constructionType: text("construction_type").notNull().default("monolith"),
  totalFloors: integer("total_floors"),
  totalUnits: integer("total_units"),
  totalArea: numeric("total_area", { precision: 12, scale: 2 }),

  // Cost calculation
  costPerSqm: numeric("cost_per_sqm", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("KGS"),
  exchangeRateSource: text("exchange_rate_source").notNull().default("nbkr"),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 4 }).default("1"),
  estimatedCostKgs: numeric("estimated_cost_kgs", { precision: 18, scale: 2 }),

  // Timeline
  startDate: text("start_date"),
  plannedEndDate: text("planned_end_date"),
  actualEndDate: text("actual_end_date"),

  description: text("description"),
  managerId: integer("manager_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertConstructionProjectSchema = createInsertSchema(constructionProjectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConstructionProject = z.infer<typeof insertConstructionProjectSchema>;
export type ConstructionProject = typeof constructionProjectsTable.$inferSelect;
