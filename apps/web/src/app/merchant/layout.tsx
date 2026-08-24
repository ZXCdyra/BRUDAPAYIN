'use client';

import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Key,
  Webhook,
  BarChart3,
  Percent,
  BookOpen,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@p2p/shared';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardShell, type NavItem } from '@/components/dashboard-shell';
import { useMerchantOrdersRealtime } from '@/lib/payin-realtime';

const MERCHANT_ALLOWED = [UserRole.MERCHANT] as const;

const navItems: NavItem[] = [
  { label: 'Главная', href: '/merchant', icon: LayoutDashboard },
  { label: 'Заявки', href: '/merchant/orders', icon: ArrowLeftRight },
  { label: 'Балансы', href: '/merchant/balances', icon: Wallet },
  { label: 'Направления', href: '/merchant/directions', icon: Percent },
  { label: 'API-ключи', href: '/merchant/api-keys', icon: Key },
  { label: 'Вебхуки', href: '/merchant/webhooks', icon: Webhook },
  { label: 'Аналитика', href: '/merchant/analytics', icon: BarChart3 },
  { label: 'Документация', href: '/merchant/docs', icon: BookOpen },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  useMerchantOrdersRealtime(queryClient);

  return (
    <AuthGuard allowedRoles={MERCHANT_ALLOWED}>
      <DashboardShell navItems={navItems} role="merchant">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
