'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowDownToLine, ArrowRight, Inbox } from 'lucide-react';
import { PayInOrderStatus } from '@p2p/shared';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { adminKeys } from '@/lib/query-keys';
import { Badge } from '@/components/ui/badge';
import { badgeVariantForPayin } from '@/lib/order-status-ui';
import { formatCurrency, formatDateTime, shortId, cn } from '@/lib/utils';
import { surfaceRingClass } from '@/lib/surface-ring';

interface IncomingPayinOrder {
  id: string;
  merchantName: string | null;
  traderName: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

const STATUS_LABEL_KEYS = [
  PayInOrderStatus.PENDING,
  PayInOrderStatus.NEW,
  PayInOrderStatus.VERIFIED,
  PayInOrderStatus.PAID,
  PayInOrderStatus.UNDERPAID,
  PayInOrderStatus.OVERPAID,
  PayInOrderStatus.APPEAL,
  PayInOrderStatus.CANCELED,
  PayInOrderStatus.EXPIRED,
  PayInOrderStatus.UPLOAD_FAILED,
  PayInOrderStatus.NO_REQUISITE,
] as const;

/** Live feed of the latest incoming Pay-In orders across all merchants. */
export function IncomingTrafficPanel() {
  const t = useTranslations('Trader.Payin');
  const tDash = useTranslations('Admin.Dashboard');

  const { data, isLoading } = useQuery<{ data: IncomingPayinOrder[]; total: number }>({
    // Nested under ordersScope so staff SSE events refresh this panel too.
    queryKey: [...adminKeys.ordersScope, 'incoming'],
    queryFn: () => api.get(internalPaths.adminOrders('type=payin&page=1&limit=8')),
    refetchInterval: 30_000,
  });

  const statusLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of STATUS_LABEL_KEYS) {
      map[s] = t(`statuses.${s}`);
    }
    return map;
  }, [t]);

  const orders = Array.isArray(data?.data) ? data.data : [];

  return (
    <section className={cn('rounded-xl p-4 sm:p-5', surfaceRingClass('blue'))}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
            <ArrowDownToLine className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {tDash('incoming.title')}
            </h2>
            <p className="text-xs text-text-muted">{tDash('incoming.subtitle')}</p>
          </div>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent-blue transition-colors hover:text-accent-blue/80"
        >
          {tDash('incoming.all')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-secondary" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Inbox className="h-8 w-8 text-text-muted" aria-hidden />
          <p className="text-sm text-text-muted">{tDash('incoming.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border-primary">
          {orders.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm first:pt-0 last:pb-0"
            >
              <span className="w-[7.5rem] shrink-0 whitespace-nowrap font-mono text-xs text-text-muted">
                {formatDateTime(new Date(row.createdAt))}
              </span>
              <span className="font-mono text-xs text-text-secondary" title={row.id}>
                #{shortId(row.id)}
              </span>
              <span className="min-w-0 max-w-[12rem] truncate text-text-primary" title={row.merchantName ?? undefined}>
                {row.merchantName ?? '—'}
              </span>
              <span className="min-w-0 max-w-[10rem] truncate text-xs text-text-muted" title={row.traderName ?? undefined}>
                {row.traderName ?? '—'}
              </span>
              <span className="ml-auto whitespace-nowrap font-medium text-text-primary">
                {formatCurrency(row.amount, row.currency)}
              </span>
              <Badge variant={badgeVariantForPayin(row.status)}>
                {statusLabels[row.status] ?? row.status.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
