'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  CreditCard,
  Plus,
  Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/ui/card';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { traderKeys } from '@/lib/query-keys';
import { formatCurrency } from '@/lib/utils';
import { statCardToneAt } from '@/lib/surface-ring';
import { TraderTopUpModal } from '@/features/trader-dashboard/topup-modal';

interface DashboardStats {
  total_volume: number;
  orders_today: number;
  success_rate: number;
  active_requisites: number;
  currency: string;
  accepting_orders?: boolean;
  account_active?: boolean;
}

interface UsdtWalletSummary {
  balance_usdt: number;
  overdraft_limit_usdt: number;
  display_own_usdt?: number;
  available_for_payin_usdt?: number;
  effective_available_for_payin_usdt?: number;
  pending_payin_usdt_debit_usdt?: number;
  work_mode?: string;
}

const formatUsdt = (v: number) =>
  v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TraderDashboard() {
  const t = useTranslations('Trader.Dashboard');
  const [topUpOpen, setTopUpOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: traderKeys.dashboardStats(),
    queryFn: () => api.get<DashboardStats>(internalPaths.traderDashboardStats),
  });

  const { data: wallet } = useQuery({
    queryKey: traderKeys.usdtWallet(),
    queryFn: () => api.get<UsdtWalletSummary>(internalPaths.traderUsdtWallet),
  });

  const paused =
    stats != null &&
    (stats.account_active === false || stats.accepting_orders === false);

  const balance = wallet?.balance_usdt ?? null;

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

      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-blue-950 p-6 shadow-lg">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex items-center gap-2 text-sm font-medium text-white/85">
                <Wallet size={16} /> Баланс USDT
              </p>
              {wallet?.work_mode && (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                  {wallet.work_mode.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <p
              data-testid="trader-balance-value"
              className={
                'mt-1 text-5xl font-bold tabular-nums tracking-tight text-white' +
                (balance !== null && balance < 0 ? ' text-red-200' : '')
              }
            >
              {balance === null ? '…' : `${formatUsdt(balance)} USDT`}
            </p>

            {wallet && (
              <dl className="mt-5 grid max-w-xl grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-white/70">Собственные средства</dt>
                  <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white">
                    {formatUsdt(wallet.display_own_usdt ?? balance ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-white/70">Доступно для Pay-In</dt>
                  <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-emerald-200">
                    {formatUsdt(
                      wallet.effective_available_for_payin_usdt ??
                        wallet.available_for_payin_usdt ??
                        0,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-white/70">В резерве под заявки</dt>
                  <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-white/90">
                    {formatUsdt(wallet.pending_payin_usdt_debit_usdt ?? 0)}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-white/70">Лимит овердрафта</dt>
                  <dd className="mt-0.5 font-mono text-xs tabular-nums text-white/80">
                    до −{formatUsdt(wallet.overdraft_limit_usdt)} USDT
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <button
            onClick={() => setTopUpOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-md transition-colors hover:bg-blue-50"
          >
            <Plus size={18} />
            Пополнить баланс
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('statTotalVolume')}
          value={statsLoading ? '...' : formatCurrency(stats?.total_volume ?? 0, stats?.currency)}
          icon={TrendingUp}
          href="/trader/statistics"
          tone={statCardToneAt(0)}
        />
        <StatCard
          title={t('statOrdersToday')}
          value={statsLoading ? '...' : (stats?.orders_today ?? 0)}
          icon={ShoppingCart}
          href="/trader/payin"
          tone={statCardToneAt(1)}
        />
        <StatCard
          title={t('statSuccessRate')}
          value={statsLoading ? '...' : `${(stats?.success_rate ?? 0).toFixed(1)}%`}
          icon={CheckCircle2}
          href="/trader/statistics"
          tone={statCardToneAt(2)}
        />
        <StatCard
          title={t('statActiveRequisites')}
          value={statsLoading ? '...' : (stats?.active_requisites ?? 0)}
          icon={CreditCard}
          href="/trader/requisites"
          tone={statCardToneAt(3)}
        />
      </div>

      {topUpOpen && <TraderTopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />}
    </div>
  );
}
