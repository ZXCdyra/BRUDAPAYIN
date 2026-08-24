import { UserRole } from '@p2p/shared';

const ROLE_DASHBOARD: Record<string, string> = {
  [UserRole.TRADER]: '/ru/trader',
  [UserRole.PAYOUT_TRADER]: '/ru/payout-trader',
  [UserRole.ADMIN]: '/ru/admin',
  [UserRole.SUPPORT]: '/ru/support',
  [UserRole.MERCHANT]: '/ru/merchant',
  [UserRole.OWNER]: '/ru/owner',
  [UserRole.REFERRAL]: '/ru/referral',
};

export function getDashboardPathForRole(role: string): string {
  return ROLE_DASHBOARD[role] ?? '/ru/trader';
}
