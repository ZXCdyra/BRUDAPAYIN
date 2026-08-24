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
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { adminKeys } from '@/lib/query-keys';
import { StatCard } from '@/components/ui/stat-card';
import { statCardToneAt, surfaceRingClass } from '@/lib/surface-ring';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

interface AdminStats {
  totalVolume: number;
  activeTraders: number;
  ordersToday: number;
  conversionRate: number;
  totalCommissions: number;
}

interface AdminTrafficOrder {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  type?: string;
  customer_email?: string | null;
  payment_method?: string;
}

const quickLinks = [
  {
    label: 'Manage Users',
    href: '/admin/users',
    description: 'Accounts, merchants, and Pay-In trader profiles',
  },
  { label: 'View Orders', href: '/admin/orders', description: 'Monitor all Pay-In and Pay-Out orders' },
  { label: 'Settlements', href: '/admin/settlements', description: 'Create and review settlements' },
  { label: 'Audit Log', href: '/admin/audit', description: 'Review all platform activity' },
];

const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'default'> = {
  PENDING: 'yellow',
  NEW: 'blue',
  VERIFIED: 'blue',
  PAID: 'green',
  COMPLETED: 'green',
  UNDERPAID: 'yellow',
  OVERPAID: 'yellow',
  APPEAL: 'red',
  CANCELED: 'red',
  EXPIRED: 'yellow',
  FAILED: 'red',
  UPLOAD_FAILED: 'red',
  NO_REQUISITE: 'yellow',
  PROCESSING: 'blue',
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: adminKeys.stats(),
    queryFn: () => api.get(internalPaths.adminStats),
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Volume"
          value={
            isLoading
              ? '...'
              : `$${(stats?.totalVolume ?? 0).toLocaleString()}`
          }
          icon={TrendingUp}
          href="/ru/admin/statistics"
          tone={statCardToneAt(0)}
        />
        <StatCard
          label="Active Traders"
          value={isLoading ? '...' : String(stats?.activeTraders ?? 0)}
          icon={Users}
          href="/ru/admin/users"
          tone={statCardToneAt(1)}
        />
        <StatCard
          label="Orders Today"
          value={isLoading ? '...' : String(stats?.ordersToday ?? 0)}
          icon={ArrowLeftRight}
          href="/ru/admin/orders"
          tone={statCardToneAt(2)}
        />
        <StatCard
          label="Conversion Rate"
          value={
            isLoading
              ? '...'
              : `${(stats?.conversionRate ?? 0).toFixed(1)}%`
          }
          icon={Percent}
          href="/ru/admin/statistics"
          tone={statCardToneAt(3)}
        />
        <StatCard
          label="Total Commissions"
          value={
            isLoading
              ? '...'
              : `$${(stats?.totalCommissions ?? 0).toLocaleString()}`
          }
          icon={DollarSign}
          href="/ru/admin/statistics"
          tone={statCardToneAt(4)}
        />
      </div>

      {/* ALL Incoming Traffic */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-accent-blue" />
              Весь входящий трафик
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              Все последние заказы платформы — Pay-In и Pay-Out
            </p>
          </div>
          <Link
            href="/ru/admin/orders"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:text-accent-blue/80"
          >
            Все сделки <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <IncomingTrafficPanel />
      </section>

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
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

function IncomingTrafficPanel() {
  const { data, isLoading } = useQuery({
    queryKey: adminKeys.incomingTraffic(),
    queryFn: () =>
      api.get<{ items: AdminTrafficOrder[]; total: number }>(
        `${internalPaths.adminOrders}?page=1&limit=20`,
      ),
  });

  const orders = data?.items ?? [];

  return (
    <div className="rounded-xl border border-border-primary bg-surface-secondary overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-primary text-left text-text-muted text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium text-right">Сумма</th>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium text-right">Время</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                  Загрузка...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                  Нет заказов
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border-primary/50 hover:bg-surface-tertiary/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {order.id.slice(0, 10)}…
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {order.type || 'Pay-In'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        (STATUS_COLORS[order.status] ?? 'default') as
                          | 'green'
                          | 'yellow'
                          | 'red'
                          | 'blue'
                          | 'default'
                      }
                      dot
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">
                    {order.amount.toLocaleString()} {order.currency}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {order.customer_email || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text-muted whitespace-nowrap">
                    {formatDateTime(new Date(order.created_at))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
