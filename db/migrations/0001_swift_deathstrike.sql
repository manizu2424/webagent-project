ALTER TABLE "consultations" ADD COLUMN "idempotency_key" uuid;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "submission_fingerprint" varchar(64);--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "idempotency_key" uuid;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "submission_fingerprint" varchar(64);--> statement-breakpoint
UPDATE "consultations" SET
	"idempotency_key" = gen_random_uuid(),
	"submission_fingerprint" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
WHERE "idempotency_key" IS NULL OR "submission_fingerprint" IS NULL;--> statement-breakpoint
UPDATE "diagnoses" SET
	"idempotency_key" = gen_random_uuid(),
	"submission_fingerprint" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
WHERE "idempotency_key" IS NULL OR "submission_fingerprint" IS NULL;--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "idempotency_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "submission_fingerprint" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ALTER COLUMN "idempotency_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ALTER COLUMN "submission_fingerprint" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_idempotency_key_unique" UNIQUE("idempotency_key");--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_idempotency_key_unique" UNIQUE("idempotency_key");
