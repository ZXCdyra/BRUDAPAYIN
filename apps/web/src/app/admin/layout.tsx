'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Landmark,
  BarChart3,
  ScrollText,
  Library,
  CreditCard,
  CircleDollarSign,
  GitFork,
  Percent,
  Table2,
  FileSearch,
} from 'lucide-react';
import { UserRole } from '@p2p/shared';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardShell, type NavItem } from '@/components/dashboard-shell';
import { useStaffOrdersRealtime } from '@/lib/payin-realtime';

const ADMIN_ALLOWED = [UserRole.ADMIN] as const;

const navItems: NavItem[] = [
  { label: 'Главная', href: '/admin', icon: LayoutDashboard },
  { label: 'Пользователи', href: '/admin/users', icon: Users },
  { label: 'Заявки', href: '/admin/orders', icon: ArrowLeftRight },
  { label: 'Казначейство', href: '/admin/treasury', icon: CircleDollarSign },
  { label: 'Каскад', href: '/admin/cascade', icon: GitFork },
  { label: 'Реквизиты каскада', href: '/admin/cascade/requisites', icon: Table2 },
  { label: 'Пул выплат', href: '/admin/payout-pool', icon: Percent },
  { label: 'Выводы (сеттлменты)', href: '/admin/settlements', icon: Landmark },
  { label: 'Справочники', href: '/admin/catalog', icon: Library },
  { label: 'Способы оплаты', href: '/admin/payment-methods', icon: CreditCard },
  { label: 'Статистика', href: '/admin/statistics', icon: BarChart3 },
  { label: 'Логи заявок', href: '/admin/orders-logs', icon: FileSearch },
  { label: 'Аудит', href: '/admin/audit', icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  useStaffOrdersRealtime(queryClient);

  return (
    <AuthGuard allowedRoles={ADMIN_ALLOWED}>
      <DashboardShell navItems={navItems} role="admin">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
