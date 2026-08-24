'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  CreditCard,
  ArrowDownToLine,
  DollarSign,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { StatCard } from '@/components/ui/card';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { traderKeys } from '@/lib/query-keys';
import { formatCurrency } from '@/lib/utils';
import { statCardToneAt } from '@/lib/surface-ring';

interface DashboardStats {
  total_volume: number;
  orders_today: number;
  success_rate: number;
  active_requisites: number;
  currency: string;
  accepting_orders?: boolean;
  account_active?: boolean;
  balance_usdt?: number;
}

export default function TraderDashboard() {
  const t = useTranslations('Trader.Dashboard');
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: traderKeys.dashboardStats(),
    queryFn: () => api.get<DashboardStats>(internalPaths.traderDashboardStats),
  });

  const paused =
    stats != null &&
    (stats.account_active === false || stats.accepting_orders === false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-sm text-text-muted mt-1">{t('subtitle')}</p>
      </div>

      {paused && (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-text-primary"
          role="status"
        >
          {stats?.account_active === false ? t('pausedAdmin') : t('pausedSelf')}
        </div>
      )}

      {/* Large balance card */}
      <div className="rounded-2xl border border-border-primary bg-gradient-to-br from-accent-blue/10 via-accent-blue/5 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-muted">{t('usdtBalance')}</p>
            <p className="mt-1 text-4xl font-bold text-text-primary tracking-tight">
              {statsLoading ? (
                <span className="text-text-muted">...</span>
              ) : (
                <span className="text-accent-green font-extrabold">
                  {formatCurrency(stats?.balance_usdt ?? 0, 'USDT')}
                </span>
              )}
            </p>
          </div>
          <DollarSign className="h-12 w-12 text-accent-blue/30" />
        </div>
        <div className="mt-5 flex gap-3">
          <Link
            href="/ru/trader/topup"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-blue/90"
          >
            <ArrowDownToLine className="h-4 w-4" />
            {t('topUp')}
          </Link>
          <Link
            href="/ru/trader/balance"
            className="inline-flex items-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-hover"
          >
            {t('history')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('statTotalVolume')}
          value={statsLoading ? '...' : formatCurrency(stats?.total_volume ?? 0, stats?.currency)}
          icon={TrendingUp}
          href="/ru/trader/statistics"
          tone={statCardToneAt(0)}
        />
        <StatCard
          title={t('statOrdersToday')}
          value={statsLoading ? '...' : (stats?.orders_today ?? 0)}
          icon={ShoppingCart}
          href="/ru/trader/payin"
          tone={statCardToneAt(1)}
        />
        <StatCard
          title={t('statSuccessRate')}
          value={statsLoading ? '...' : `${(stats?.success_rate ?? 0).toFixed(1)}%`}
          icon={CheckCircle2}
          href="/ru/trader/statistics"
          tone={statCardToneAt(2)}
        />
        <StatCard
          title={t('statActiveRequisites')}
          value={statsLoading ? '...' : (stats?.active_requisites ?? 0)}
          icon={CreditCard}
          href="/ru/trader/requisites"
          tone={statCardToneAt(3)}
        />
      </div>
    </div>
  );
}
