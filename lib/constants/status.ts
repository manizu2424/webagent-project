export const diagnosisStatusValues = [
  "SUBMITTED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

export type DiagnosisStatus = (typeof diagnosisStatusValues)[number];

export const consultationStatusValues = [
  "NEW",
  "CONTACT_PENDING",
  "SCHEDULED",
  "PROPOSAL_SENT",
  "CONTRACTED",
  "HOLD",
  "CLOSED",
] as const;

export type ConsultationStatus = (typeof consultationStatusValues)[number];
