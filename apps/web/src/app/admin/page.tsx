'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  ArrowLeftRight,
  Percent,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { adminKeys } from '@/lib/query-keys';
import { StatCard } from '@/components/ui/stat-card';
import { statCardToneAt, surfaceRingClass } from '@/lib/surface-ring';
import { cn } from '@/lib/utils';
import { IncomingTrafficPanel } from './incoming-traffic-panel';

interface AdminStats {
  totalVolume: number;
  activeTraders: number;
  ordersToday: number;
  conversionRate: number;
  totalCommissions: number;
}

const quickLinks = [
  {
    label: 'Пользователи',
    href: '/admin/users',
    description: 'Аккаунты, мерчанты и профили Pay-In трейдеров',
  },
  {
    label: 'Заявки',
    href: '/admin/orders',
    description: 'Мониторинг всех Pay-In и Pay-Out заявок',
  },
  {
    label: 'Выплаты',
    href: '/admin/settlements',
    description: 'Создание и проверка выплат',
  },
  {
    label: 'Журнал аудита',
    href: '/admin/audit',
    description: 'Вся активность платформы',
  },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: adminKeys.stats(),
    queryFn: () => api.get(internalPaths.adminStats),
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Дашборд</h1>
        <p className="text-sm text-text-muted mt-1">Обзор платформы и ключевые метрики</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Общий объём"
          value={
            isLoading
              ? '...'
              : `$${(stats?.totalVolume ?? 0).toLocaleString()}`
          }
          icon={TrendingUp}
          href="/admin/statistics"
          tone={statCardToneAt(0)}
        />
        <StatCard
          label="Активные трейдеры"
          value={isLoading ? '...' : String(stats?.activeTraders ?? 0)}
          icon={Users}
          href="/admin/users"
          tone={statCardToneAt(1)}
        />
        <StatCard
          label="Заявки сегодня"
          value={isLoading ? '...' : String(stats?.ordersToday ?? 0)}
          icon={ArrowLeftRight}
          href="/admin/orders"
          tone={statCardToneAt(2)}
        />
        <StatCard
          label="Конверсия"
          value={
            isLoading
              ? '...'
              : `${(stats?.conversionRate ?? 0).toFixed(1)}%`
          }
          icon={Percent}
          href="/admin/statistics"
          tone={statCardToneAt(3)}
        />
        <StatCard
          label="Комиссии"
          value={
            isLoading
              ? '...'
              : `$${(stats?.totalCommissions ?? 0).toLocaleString()}`
          }
          icon={DollarSign}
          href="/admin/statistics"
          tone={statCardToneAt(4)}
        />
      </div>

      <IncomingTrafficPanel />

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'group flex items-center justify-between rounded-xl p-4 transition-colors',
                surfaceRingClass(statCardToneAt(i)),
                'hover:ring-border-secondary/55 hover:border-border-secondary',
              )}
            >
              <div>
                <p className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                  {link.label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{link.description}</p>
              </div>
              <ArrowRight
                size={16}
                className="text-text-muted group-hover:text-accent-blue transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
