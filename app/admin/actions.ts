"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { consultations, diagnoses } from "@/db/schema";
import { getAdminSession } from "@/lib/auth/admin";
import {
  consultationStatusValues,
  diagnosisStatusValues,
  type ConsultationStatus,
  type DiagnosisStatus,
} from "@/lib/constants/status";

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }
}

export async function updateDiagnosisStatus(formData: FormData) {
  await requireAdmin();

  const publicId = String(formData.get("publicId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!diagnosisStatusValues.includes(status as DiagnosisStatus)) {
    return;
  }

  await getDb()
    .update(diagnoses)
    .set({ status: status as DiagnosisStatus, updatedAt: new Date() })
    .where(eq(diagnoses.publicId, publicId));

  revalidatePath("/admin/diagnoses");
  revalidatePath(`/admin/diagnoses/${publicId}`);
}

export async function updateConsultationStatus(formData: FormData) {
  await requireAdmin();

  const consultationId = String(formData.get("consultationId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!consultationStatusValues.includes(status as ConsultationStatus)) {
    return;
  }

  await getDb()
    .update(consultations)
    .set({ status: status as ConsultationStatus, updatedAt: new Date() })
    .where(eq(consultations.id, consultationId));

  revalidatePath("/admin/consultations");
}
