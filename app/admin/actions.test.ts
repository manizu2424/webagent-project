import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminSession: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/admin", () => ({
  getAdminSession: mocks.getAdminSession,
}));
vi.mock("@/db", () => ({
  getDb: () => ({ update: mocks.update }),
}));

import { updateConsultationMemo, updateConsultationStatus } from "./actions";

const consultationId = "123e4567-e89b-42d3-a456-426614174002";

describe("consultation admin actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getAdminSession.mockResolvedValue({ email: "admin@example.com" });
    mocks.where.mockResolvedValue(undefined);
    mocks.set.mockReturnValue({ where: mocks.where });
    mocks.update.mockReturnValue({ set: mocks.set });
  });

  it("stores a trimmed memo and refreshes list and detail", async () => {
    const formData = new FormData();
    formData.set("consultationId", consultationId);
    formData.set("memo", "  다음 주 화요일 재연락  ");

    await updateConsultationMemo(formData);

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ memo: "다음 주 화요일 재연락" }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/consultations");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      `/admin/consultations/${consultationId}`,
    );
  });

  it("rejects an invalid memo target without updating", async () => {
    const formData = new FormData();
    formData.set("consultationId", "invalid-id");
    formData.set("memo", "저장되면 안 됨");

    await updateConsultationMemo(formData);

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates status and refreshes the detail page", async () => {
    const formData = new FormData();
    formData.set("consultationId", consultationId);
    formData.set("status", "SCHEDULED");

    await updateConsultationStatus(formData);

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "SCHEDULED" }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      `/admin/consultations/${consultationId}`,
    );
  });
});
