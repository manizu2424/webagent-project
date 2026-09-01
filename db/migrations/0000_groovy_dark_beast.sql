CREATE TYPE "public"."consultation_status" AS ENUM('NEW', 'CONTACT_PENDING', 'SCHEDULED', 'PROPOSAL_SENT', 'CONTRACTED', 'HOLD', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."diagnosis_status" AS ENUM('SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "automation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnosis_id" uuid,
	"workflow_name" varchar(100) NOT NULL,
	"execution_id" varchar(100),
	"status" varchar(50) NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"diagnosis_id" uuid,
	"preferred_date" timestamp with time zone,
	"consultation_type" varchar(50),
	"message" text,
	"status" "consultation_status" DEFAULT 'NEW' NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"website_status" varchar(50),
	"current_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"repetitive_tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"daily_hours" numeric(6, 2),
	"monthly_volume" integer,
	"pain_point" text,
	"budget_range" varchar(50),
	"raw_answers" jsonb,
	"status" "diagnosis_status" DEFAULT 'SUBMITTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnoses_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "diagnosis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnosis_id" uuid NOT NULL,
	"automation_score" integer NOT NULL,
	"recommended_tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_saved_hours_min" numeric(6, 2),
	"estimated_saved_hours_max" numeric(6, 2),
	"difficulty" varchar(50),
	"recommended_stack" jsonb DEFAULT '[]'::jsonb,
	"implementation_steps" jsonb DEFAULT '[]'::jsonb,
	"ai_summary" text,
	"raw_ai_result" jsonb,
	"model_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnosis_results_diagnosis_id_unique" UNIQUE("diagnosis_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"industry" varchar(100),
	"employee_count" integer,
	"contact_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"consulting_method" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnosis_results" ADD CONSTRAINT "diagnosis_results_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE cascade ON UPDATE no action;