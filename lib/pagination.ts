export const ADMIN_PAGE_SIZE = 25;

export function parsePage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function getTotalPages(totalItems: number, pageSize = ADMIN_PAGE_SIZE) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}
