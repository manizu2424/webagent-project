import { NextResponse } from "next/server";

export type ApiResponse<T = unknown> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json<ApiResponse>({ ok: false, error }, { status });
}

export async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
