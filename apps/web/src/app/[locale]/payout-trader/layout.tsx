'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ArrowUpFromLine,
  Wallet,
  BarChart3,
  Bell,
  Send,
} from 'lucide-react';
import { UserRole } from '@p2p/shared';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardShell, type NavItem } from '@/components/dashboard-shell';
import { usePayOutSpecialistRealtime, usePayoutTraderTelegramRealtime } from '@/lib/payin-realtime';

const PAYOUT_TRADER_ALLOWED = [UserRole.PAYOUT_TRADER] as const;

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/ru/payout-trader', icon: LayoutDashboard },
  { label: 'Pay-Out', href: '/ru/payout-trader/payout', icon: ArrowUpFromLine, navBadge: 'payout-pool' },
  { label: 'Statistics', href: '/ru/payout-trader/statistics', icon: BarChart3 },
  { label: 'Balance', href: '/ru/payout-trader/balance', icon: Wallet },
  { label: 'Telegram', href: '/ru/payout-trader/telegram', icon: Send },
  { label: 'Notifications', href: '/ru/payout-trader/notifications', icon: Bell },
];

export default function PayoutTraderLayout({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  usePayOutSpecialistRealtime(queryClient);
  usePayoutTraderTelegramRealtime(queryClient);

  return (
    <AuthGuard allowedRoles={PAYOUT_TRADER_ALLOWED}>
      <DashboardShell navItems={navItems} role="payout-trader">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
