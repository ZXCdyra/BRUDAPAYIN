'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  ArrowLeftRight,
  Percent,
  DollarSign,
} from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { merchantKeys } from '@/lib/query-keys';
import { StatCard } from '@/components/ui/stat-card';
import { Select } from '@/components/ui/select';

interface MerchantAnalytics {
  period: '24h' | '7d' | '30d' | '90d' | null;
  dateFrom: string | null;
  dateTo: string | null;
  totalVolume: number;
  payInVolume: number;
  payOutVolume: number;
  totalOrders: number;
  payInOrders: number;
  payOutOrders: number;
  conversionRate: number;
  avgOrderAmount: number;
}

const PERIOD_OPTIONS = [
  { value: '24h', label: 'Последние 24 часа' },
  { value: '7d', label: 'Последние 7 дней' },
  { value: '30d', label: 'Последние 30 дней' },
  { value: '90d', label: 'Последние 90 дней' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');

  const { data: analytics, isLoading } = useQuery<MerchantAnalytics>({
    queryKey: merchantKeys.analytics(period),
    queryFn: () =>
      api.get<MerchantAnalytics>(internalPaths.merchantAnalytics, { period }),
  });

  const loading = isLoading || !analytics;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={24} />
            Аналитика
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Оборот, количество заявок и конверсия
          </p>
        </div>
        <Select
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-44"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Общий оборот"
          value={loading ? '...' : `$${analytics.totalVolume.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Всего заявок"
          value={loading ? '...' : analytics.totalOrders.toLocaleString()}
          icon={ArrowLeftRight}
        />
        <StatCard
          label="Конверсия"
          value={loading ? '...' : `${analytics.conversionRate.toFixed(1)}%`}
          icon={Percent}
        />
        <StatCard
          label="Средний чек"
          value={
            loading ? '...' : `$${analytics.avgOrderAmount.toLocaleString()}`
          }
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border-primary rounded-xl p-5">
          <h3 className="text-sm text-text-muted mb-3">Приём (Pay-In)</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm">Оборот</span>
              <span className="text-text-primary font-mono text-sm">
                ${loading ? '...' : analytics.payInVolume.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm">Заявок</span>
              <span className="text-text-primary font-mono text-sm">
                {loading ? '...' : analytics.payInOrders.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-xl p-5">
          <h3 className="text-sm text-text-muted mb-3">Выплаты (Pay-Out)</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm">Оборот</span>
              <span className="text-text-primary font-mono text-sm">
                ${loading ? '...' : analytics.payOutVolume.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary text-sm">Заявок</span>
              <span className="text-text-primary font-mono text-sm">
                {loading ? '...' : analytics.payOutOrders.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Графики</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-bg-card border border-border-primary rounded-xl p-8 flex items-center justify-center min-h-[300px]">
            <div className="text-center text-text-muted">
              <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Оборот по времени</p>
              <p className="text-xs mt-1">Скоро</p>
            </div>
          </div>
          <div className="bg-bg-card border border-border-primary rounded-xl p-8 flex items-center justify-center min-h-[300px]">
            <div className="text-center text-text-muted">
              <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Динамика конверсии</p>
              <p className="text-xs mt-1">Скоро</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
