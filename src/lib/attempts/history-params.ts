import type { AttemptStatus } from '@/types/attempt';

import { ROUTES } from '@/constants/routes';

export const ATTEMPT_STATUSES = [
  'IN_PROGRESS',
  'SUBMITTED',
  'GRADED',
  'EXPIRED',
] as const satisfies readonly AttemptStatus[];

export const isAttemptStatus = (value: unknown): value is AttemptStatus =>
  (ATTEMPT_STATUSES as readonly unknown[]).includes(value);

export type HistoryParams = {
  status?: AttemptStatus;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  return Math.min(Number(value), 1);
}

export function parseHistoryParams(sp: SearchParams): HistoryParams {
  const status = first(sp.status);
  return {
    status: isAttemptStatus(status) ? status : undefined,
    page: parsePage(first(sp.page)),
  };
}

export function historyQuery({
  status,
}: Partial<HistoryParams>): Record<string, string> {
  return status ? { status } : {};
}

export function buildAttemptsHref({ status, page }: Partial<HistoryParams>) {
  const params = new URLSearchParams(historyQuery({ status }));
  if (page && page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `${ROUTES.ATTEMPTS}?${query}` : ROUTES.ATTEMPTS;
}
