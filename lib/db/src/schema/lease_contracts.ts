import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leaseContractsTable = pgTable("lease_contracts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  contractNumber: text("contract_number").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  rentAmount: numeric("rent_amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("KZT"),
  depositAmount: numeric("deposit_amount", { precision: 14, scale: 2 }),
  accrualDay: integer("accrual_day"),
  status: text("status").notNull().default("draft"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeaseContractSchema = createInsertSchema(leaseContractsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLeaseContract = z.infer<typeof insertLeaseContractSchema>;
export type LeaseContract = typeof leaseContractsTable.$inferSelect;
