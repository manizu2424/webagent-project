import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  consultationStatusValues,
  diagnosisStatusValues,
} from "@/lib/constants/status";

export const diagnosisStatusEnum = pgEnum(
  "diagnosis_status",
  diagnosisStatusValues,
);

export const consultationStatusEnum = pgEnum(
  "consultation_status",
  consultationStatusValues,
);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  employeeCount: integer("employee_count"),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  consultingMethod: varchar("consulting_method", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: uuid("public_id").defaultRandom().notNull().unique(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  websiteStatus: varchar("website_status", { length: 50 }),
  currentTools: jsonb("current_tools").$type<string[]>().notNull().default([]),
  repetitiveTasks: jsonb("repetitive_tasks")
    .$type<string[]>()
    .notNull()
    .default([]),
  dailyHours: numeric("daily_hours", { precision: 6, scale: 2 }),
  monthlyVolume: integer("monthly_volume"),
  painPoint: text("pain_point"),
  budgetRange: varchar("budget_range", { length: 50 }),
  rawAnswers: jsonb("raw_answers").$type<Record<string, unknown>>(),
  status: diagnosisStatusEnum("status").notNull().default("SUBMITTED"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const diagnosisResults = pgTable("diagnosis_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  diagnosisId: uuid("diagnosis_id")
    .notNull()
    .unique()
    .references(() => diagnoses.id, { onDelete: "cascade" }),
  automationScore: integer("automation_score").notNull(),
  recommendedTasks: jsonb("recommended_tasks")
    .$type<Record<string, unknown>[]>()
    .notNull()
    .default([]),
  estimatedSavedHoursMin: numeric("estimated_saved_hours_min", {
    precision: 6,
    scale: 2,
  }),
  estimatedSavedHoursMax: numeric("estimated_saved_hours_max", {
    precision: 6,
    scale: 2,
  }),
  difficulty: varchar("difficulty", { length: 50 }),
  recommendedStack: jsonb("recommended_stack").$type<string[]>().default([]),
  implementationSteps: jsonb("implementation_steps")
    .$type<Record<string, unknown>[]>()
    .default([]),
  aiSummary: text("ai_summary"),
  rawAiResult: jsonb("raw_ai_result").$type<Record<string, unknown>>(),
  modelName: varchar("model_name", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const consultations = pgTable("consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  diagnosisId: uuid("diagnosis_id").references(() => diagnoses.id, {
    onDelete: "set null",
  }),
  preferredDate: timestamp("preferred_date", { withTimezone: true }),
  consultationType: varchar("consultation_type", { length: 50 }),
  message: text("message"),
  status: consultationStatusEnum("status").notNull().default("NEW"),
  memo: text("memo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const automationLogs = pgTable("automation_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  diagnosisId: uuid("diagnosis_id").references(() => diagnoses.id, {
    onDelete: "set null",
  }),
  workflowName: varchar("workflow_name", { length: 100 }).notNull(),
  executionId: varchar("execution_id", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const leadsRelations = relations(leads, ({ many }) => ({
  diagnoses: many(diagnoses),
  consultations: many(consultations),
}));

export const diagnosesRelations = relations(diagnoses, ({ one, many }) => ({
  lead: one(leads, {
    fields: [diagnoses.leadId],
    references: [leads.id],
  }),
  result: one(diagnosisResults),
  consultations: many(consultations),
  automationLogs: many(automationLogs),
}));

export const diagnosisResultsRelations = relations(
  diagnosisResults,
  ({ one }) => ({
    diagnosis: one(diagnoses, {
      fields: [diagnosisResults.diagnosisId],
      references: [diagnoses.id],
    }),
  }),
);

export const consultationsRelations = relations(consultations, ({ one }) => ({
  lead: one(leads, {
    fields: [consultations.leadId],
    references: [leads.id],
  }),
  diagnosis: one(diagnoses, {
    fields: [consultations.diagnosisId],
    references: [diagnoses.id],
  }),
}));

export const automationLogsRelations = relations(automationLogs, ({ one }) => ({
  diagnosis: one(diagnoses, {
    fields: [automationLogs.diagnosisId],
    references: [diagnoses.id],
  }),
}));
