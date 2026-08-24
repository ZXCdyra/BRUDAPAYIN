import { PayInOrderStatus } from '@p2p/shared';
import type { TraderPayInOrderDto } from '@p2p/shared';
import type { FinalizeKind } from './payin-types';

export function maskRequisite(numberRaw: string | null | undefined): string {
  if (!numberRaw) return '—';
  const trimmed = numberRaw.replace(/\s/g, '');
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}

export function parsePositiveAmount(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function finalizeTargetPreview(
  order: Pick<TraderPayInOrderDto, 'amount'>,
  kind: FinalizeKind,
  actual?: number,
): string {
  const orderAmt = Number(order.amount);
  if (kind === 'paid') return 'Paid';
  if (kind === 'adjustment') {
    if (actual === undefined) return 'Adjusted (enter amount)';
    if (actual === orderAmt) return 'Paid';
    if (actual < orderAmt) return 'Underpaid';
    return 'Overpaid';
  }
  return 'Canceled';
}

/** Accent for the preview line describing the upcoming status label */
export function finalizePreviewTone(
  order: Pick<TraderPayInOrderDto, 'amount'>,
  kind: FinalizeKind,
  adjustmentInput: string,
): string {
  if (kind === 'paid') return 'text-accent-green';
  if (kind === 'cancel') return 'text-accent-red';
  const actual = parsePositiveAmount(adjustmentInput);
  if (actual === null) return 'text-text-secondary';
  const o = Number(order.amount);
  if (actual === o) return 'text-accent-green';
  if (actual < o) return 'text-warning';
  return 'text-accent-purple';
}

export function finalizeOptionsForOrder(order: Pick<TraderPayInOrderDto, 'status'>): FinalizeKind[] {
  const isTerminal = 
    order.status === PayInOrderStatus.PAID ||
    order.status === PayInOrderStatus.UNDERPAID ||
    order.status === PayInOrderStatus.OVERPAID ||
    order.status === PayInOrderStatus.CANCELED;
  
  if (isTerminal) {
    return [];
  }
  
  // Traders cannot change order status — only merchants and admins can.
  return [];
}

export function orderPayinProofFileIds(row: {
  payer_payment_proof_file_ids?: string[];
  appeals?: ReadonlyArray<{ proofs_of_payment: string[] }>;
}): string[] {
  const ids: string[] = [...(row.payer_payment_proof_file_ids ?? [])];
  for (const a of row.appeals ?? []) {
    for (const f of a.proofs_of_payment) {
      if (!ids.includes(f)) ids.push(f);
    }
  }
  return ids;
}

export function payinDirectionLabel(row: {
  payment_detail?: { type?: string } | null;
}): string {
  const t = row.payment_detail?.type;
  if (t === 'CARD' || t === 'IBAN') return t;
  return '—';
}
