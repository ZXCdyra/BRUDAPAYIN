/** Staff settlements list: operator login, or "Automatic" for worker-credited on-chain top-ups. */
export function settlementRecordedByLabel(row: {
  admin?: { login?: string; email?: string | null } | null;
  walletDeposit?: unknown | null;
}): string {
  const admin = row.admin?.login ?? row.admin?.email ?? null;
  if (admin) return admin;
  if (row.walletDeposit) return 'Automatic';
  return '—';
}
