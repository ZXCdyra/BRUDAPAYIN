'use client';

import { StaffUserAccountsPanel } from '@/features/staff-users';

export default function AdminUsersPage() {
  return <StaffUserAccountsPanel queryKeyPrefix="admin" />;
}
