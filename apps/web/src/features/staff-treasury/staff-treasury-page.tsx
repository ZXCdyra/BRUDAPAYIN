'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleDollarSign, Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseDecimalInput } from '@/lib/decimal-input';
import { treasuryKeys, topupKeys, type StaffRolePrefix } from '@/lib/query-keys';

type ExchangeStatus = {
  primaryPairParserFiatPerUsdt: number | null;
  cacheUpdatedAt: string | null;
  lastSuccessAt: string | null;
  stale: boolean;
  staleThresholdMinutes: number;
  rawSample: unknown;
  cacheRawSample?: unknown;
};

type IncomeSummary = {
  totalIncomeUsdt: number;
  totalIncomeLocal: number;
  rowCount: number;
  byOrderType: Array<{
    order_type: string;
    income_usdt: number;
    income_local: number;
    count: number;
  }>;
  topMerchants?: Array<{
    merchant_id: string;
    merchant_name: string;
    income_usdt: number;
    income_local: number;
    count: number;
  }>;
};

type OperationsSummary = {
  payin_orders_created: number;
  payin_orders_paid: number;
  payout_orders_created: number;
  payout_orders_completed: number;
  conversion_payin_pct: number;
  conversion_payout_pct: number;
  conversion_overall_pct: number;
  turnover_local_from_income_ledger: number;
  sum_income_usdt_in_range: number;
  sum_income_local_booked_in_range: number;
  reference_income_local_at_current_parser: number | null;
  current_parser_fiat_per_usdt: number | null;
  trader_rate_bonus_usdt: Array<{
    trader_id: string;
    trader_login: string;
    payin_bonus_usdt: number;
    payout_bonus_usdt: number;
    total_bonus_usdt: number;
  }>;
};

function incomeOrderKindLabel(orderType: string): string {
  const u = orderType.toUpperCase();
  if (u === 'PAYIN') return 'Pay-In';
  if (u === 'PAYOUT') return 'Pay-Out';
  return orderType.replace(/_/g, ' ');
}

export interface StaffTreasuryPageProps {
  staffPrefix: StaffRolePrefix;
}

export function StaffTreasuryPage({ staffPrefix }: StaffTreasuryPageProps) {
  const queryClient = useQueryClient();
  const [wAmount, setWAmount] = useState('');
  const [wAddress, setWAddress] = useState('');
  const [wNetwork, setWNetwork] = useState<'TRC20' | 'ERC20'>('TRC20');
  const [wTx, setWTx] = useState('');
  const [wNote, setWNote] = useState('');

  const [dTrader, setDTrader] = useState('');
  const [dTx, setDTx] = useState('');
  const [dAmount, setDAmount] = useState('');
  const [dConf, setDConf] = useState('20');
  const [dNetwork, setDNetwork] = useState<'TRC20' | 'ERC20'>('TRC20');

  const [topUpStatusFilter, setTopUpStatusFilter] = useState('');
  const [topUpPage, setTopUpPage] = useState(1);

  const [approveNote, setApproveNote] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const [opFrom, setOpFrom] = useState('');
  const [opTo, setOpTo] = useState('');

  const opQs =
    opFrom || opTo
      ? new URLSearchParams({
          ...(opFrom ? { dateFrom: opFrom } : {}),
          ...(opTo ? { dateTo: opTo } : {}),
        }).toString()
      : '';

  const { data: xr, isLoading: xrLoading } = useQuery({
    queryKey: treasuryKeys.exchangeRate(staffPrefix),
    queryFn: () => api.get<ExchangeStatus>(internalPaths.adminPlatformExchangeRate),
  });

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: treasuryKeys.incomeSummary(staffPrefix),
    queryFn: () => api.get<IncomeSummary>(internalPaths.adminPlatformIncomeSummary()),
  });

  const { data: recent } = useQuery({
    queryKey: treasuryKeys.incomeRecent(staffPrefix),
    queryFn: () =>
      api.get<{ data: unknown[] }>(internalPaths.adminPlatformIncomeRecent('page=1&limit=15')),
  });

  const { data: withdrawals } = useQuery({
    queryKey: treasuryKeys.withdrawals(staffPrefix),
    queryFn: () =>
      api.get<{ data: unknown[] }>(internalPaths.adminPlatformWithdrawals('page=1&limit=20')),
  });

  const { data: deposits } = useQuery({
    queryKey: treasuryKeys.deposits(staffPrefix),
    queryFn: () =>
      api.get<{ data: unknown[] }>(internalPaths.adminPlatformWalletDeposits('page=1&limit=20')),
  });

  const { data: ops, isLoading: opsLoading } = useQuery({
    queryKey: treasuryKeys.operations(staffPrefix, opFrom, opTo),
    queryFn: () => api.get<OperationsSummary>(internalPaths.adminPlatformOperationsSummary(opQs)),
  });

  const { data: topUps, isLoading: topUpLoading } = useQuery({
    queryKey: topupKeys.adminList(topUpPage, topUpStatusFilter),
    queryFn: () =>
      api.get<{ data: Array<{
        id: string;
        trader: { user: { login?: string; email?: string | null } };
        txHash: string;
        network: string;
        amountUsdt: string;
        status: string;
        comment: string | null;
        adminNote: string | null;
        createdAt: string;
      }>; total: number; page: number; limit: number }>(
        `${internalPaths.adminTopUpRequests}?page=${topUpPage}&limit=30${topUpStatusFilter ? `&status=${topUpStatusFilter}` : ''}`,
      ),
  });

  const topUpsList = topUps?.data ?? [];
  const topUpsTotal = topUps?.total ?? 0;
  const topUpsTotalPages = Math.max(1, Math.ceil(topUpsTotal / 30));

  const approveMut = useMutation({
    mutationFn: (id: string) =>
      api.post(internalPaths.adminTopUpRequestApprove(id), {
        admin_note: approveNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topupKeys.adminList(topUpPage, topUpStatusFilter) });
      setApproveNote('');
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api.post(`${internalPaths.adminTopUpRequestReject(id)}`, { adminNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topupKeys.adminList(topUpPage, topUpStatusFilter) });
      setRejectId(null);
      setRejectNote('');
    },
  });

  const withdrawalMut = useMutation({
    mutationFn: () =>
      api.post(internalPaths.adminPlatformWithdrawalsPost, {
        amount_usdt: parseDecimalInput(wAmount),
        cold_wallet_address: wAddress,
        network: wNetwork,
        tx_hash: wTx || undefined,
        note: wNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treasuryKeys.withdrawals(staffPrefix) });
      setWAmount('');
      setWAddress('');
      setWTx('');
      setWNote('');
    },
  });

  const depositMut = useMutation({
    mutationFn: () =>
      api.post(internalPaths.adminPlatformWalletDepositConfirm, {
        trader_id: dTrader,
        tx_hash: dTx,
        network: dNetwork,
        amount_usdt: parseDecimalInput(dAmount),
        confirmations: parseInt(dConf, 10) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treasuryKeys.deposits(staffPrefix) });
      setDTrader('');
      setDTx('');
      setDAmount('');
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <CircleDollarSign size={24} />
          Казначейство
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Статус курса, доходы платформы, холодный кошелёк и заявки на пополнение
        </p>
      </div>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">Курс (фиат за USDT)</h2>
        {xrLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : xr ? (
          <div className="text-sm space-y-1">
            <p>
              <span className="text-text-muted">Rate:</span>{' '}
              <span className="tabular-nums">{xr.primaryPairParserFiatPerUsdt ?? '—'}</span>
            </p>
            <p>
              <span className="text-text-muted">Last update:</span>{' '}
              {xr.cacheUpdatedAt ?? '—'}
            </p>
            <p>
              <span className="text-text-muted">Last successful refresh:</span>{' '}
              {xr.lastSuccessAt ?? '—'}
            </p>
            <p>
              <span className="text-text-muted">Stale after {xr.staleThresholdMinutes} min:</span>{' '}
              <span className={xr.stale ? 'text-accent-yellow' : 'text-accent-green'}>
                {xr.stale ? 'yes' : 'no'}
              </span>
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Курс (фиат за USDT)</h2>
        {xrLoading ? (
          <p className="text-sm text-text-muted">Загрузка…</p>
        ) : xr ? (
          <div className="text-sm space-y-1">
            <p>
              <span className="text-text-muted">Курс:</span>{' '}
              <span className="tabular-nums">{xr.primaryPairParserFiatPerUsdt ?? '—'}</span>
            </p>
            <p>
              <span className="text-text-muted">Последнее обновление:</span>{' '}
              {xr.cacheUpdatedAt ?? '—'}
            </p>
            <p>
              <span className="text-text-muted">Последнее успешное обновление:</span>{' '}
              {xr.lastSuccessAt ?? '—'}
            </p>
            <p>
              <span className="text-text-muted">Устарел через {xr.staleThresholdMinutes} мин:</span>{' '}
              <span className={xr.stale ? 'text-accent-yellow' : 'text-accent-green'}>
                {xr.stale ? 'да' : 'нет'}
              </span>
            </p>
          </div>
        ) : null}
      </section>

      {summary?.topMerchants && summary.topMerchants.length > 0 ? (
        <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-2">
          <h2 className="text-sm font-semibold text-text-primary">Income by merchant (top)</h2>
          <div className="max-h-48 overflow-auto text-xs space-y-1">
            {summary.topMerchants.map((m) => (
              <div
                key={m.merchant_id}
                className="flex justify-between gap-2 border-b border-border-subtle/50 py-1"
              >
                <span className="truncate text-text-secondary">{m.merchant_name}</span>
                <span>{m.income_usdt.toFixed(4)} USDT</span>
                <span className="text-text-muted">{m.count} orders</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Operations and conversion</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-text-muted block mb-1">From</label>
            <input
              type="date"
              className="rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
              value={opFrom}
              onChange={(e) => setOpFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">To</label>
            <input
              type="date"
              className="rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
              value={opTo}
              onChange={(e) => setOpTo(e.target.value)}
            />
          </div>
        </div>
        {opsLoading || !ops ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : (
          <div className="text-xs space-y-2">
            <p className="tabular-nums">
              Pay-In: {ops.payin_orders_paid} paid / {ops.payin_orders_created} created (
              {ops.conversion_payin_pct.toFixed(1)}%)
            </p>
            <p className="tabular-nums">
              Pay-Out: {ops.payout_orders_completed} completed / {ops.payout_orders_created} created (
              {ops.conversion_payout_pct.toFixed(1)}%)
            </p>
            <p className="tabular-nums">Overall funnel: {ops.conversion_overall_pct.toFixed(1)}%</p>
            <p className="tabular-nums">
              Turnover (local fiat, booked): {ops.turnover_local_from_income_ledger.toFixed(2)}
            </p>
            <p className="tabular-nums">Income USDT (range): {ops.sum_income_usdt_in_range.toFixed(6)}</p>
            <p className="tabular-nums">
              Income local fiat booked (range): {ops.sum_income_local_booked_in_range.toFixed(2)}
            </p>
            <p className="tabular-nums">
              {ops.reference_income_local_at_current_parser != null &&
              ops.current_parser_fiat_per_usdt != null ? (
                <>
                  Estimated local fiat at current rate:{' '}
                  {ops.reference_income_local_at_current_parser.toFixed(2)} (
                  {ops.current_parser_fiat_per_usdt.toFixed(4)} local per USDT)
                </>
              ) : (
                'Estimated local fiat at current rate: —'
              )}
            </p>
            <div className="pt-2">
              <p className="text-text-muted mb-1">Trader rate bonus (USDT est.)</p>
              <div className="max-h-40 overflow-auto space-y-0.5">
                {ops.trader_rate_bonus_usdt.length === 0 ? (
                  <span className="text-text-muted">No data in range</span>
                ) : (
                  ops.trader_rate_bonus_usdt.map((t) => (
                    <div
                      key={t.trader_id}
                      className="flex justify-between gap-2 border-b border-border-subtle/40 py-0.5"
                    >
                      <span className="truncate text-text-secondary">{t.trader_login}</span>
                      <span>{t.total_bonus_usdt.toFixed(4)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Последний доход</h2>
        <div className="max-h-56 overflow-auto text-xs space-y-1">
          {(recent?.data as Array<{ id: string; incomeUsdt: unknown; orderType: string }>)?.map(
            (r) => (
              <div
                key={r.id}
                className="flex justify-between gap-2 border-b border-border-subtle/50 py-1 tabular-nums"
              >
                <span className="text-text-muted truncate" title={r.id}>
                  …{r.id.slice(0, 8)}
                </span>
                <span>{r.orderType === 'PAYIN' ? 'Pay-In' : 'Pay-Out'}</span>
                <span>{String(r.incomeUsdt)}</span>
              </div>
            ),
          ) ?? <p className="text-text-muted">Нет данных</p>}
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Вывод на холодный кошелёк</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Сумма USDT"
            value={wAmount}
            onChange={(e) => setWAmount(e.target.value)}
            placeholder="0"
            inputMode="decimal"
          />
          <Input
            label="Адрес холодного кошелька"
            value={wAddress}
            onChange={(e) => setWAddress(e.target.value)}
          />
          <div>
            <label className="text-xs text-text-muted block mb-1">Сеть</label>
            <select
              className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
              value={wNetwork}
              onChange={(e) => setWNetwork(e.target.value as 'TRC20' | 'ERC20')}
            >
              <option value="TRC20">TRC20</option>
              <option value="ERC20">ERC20</option>
            </select>
          </div>
          <Input label="Хеш транзакции (необязательно)" value={wTx} onChange={(e) => setWTx(e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Примечание (необязательно)" value={wNote} onChange={(e) => setWNote(e.target.value)} />
          </div>
        </div>
        <Button
          onClick={() => withdrawalMut.mutate()}
          disabled={withdrawalMut.isPending || !wAmount || !wAddress}
        >
          <Save size={16} className="mr-2 inline" />
          Сохранить
        </Button>
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Ручное зачисление депозита</h2>
        <p className="text-xs text-text-muted">
          Автоматическое зачисление TRC-20 работает, когда у трейдера есть адрес депозита. Используйте эту форму только для ручного внесения.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="ID трейдера"
            value={dTrader}
            onChange={(e) => setDTrader(e.target.value)}
          />
          <Input label="Хеш транзакции" value={dTx} onChange={(e) => setDTx(e.target.value)} />
          <Input label="Сумма USDT" value={dAmount} onChange={(e) => setDAmount(e.target.value)} inputMode="decimal" />
          <Input label="Подтверждения" value={dConf} onChange={(e) => setDConf(e.target.value)} />
          <div>
            <label className="text-xs text-text-muted block mb-1">Сеть</label>
            <select
              className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
              value={dNetwork}
              onChange={(e) => setDNetwork(e.target.value as 'TRC20' | 'ERC20')}
            >
              <option value="TRC20">TRC20</option>
              <option value="ERC20">ERC20</option>
            </select>
          </div>
        </div>
        <Button
          onClick={() => depositMut.mutate()}
          disabled={depositMut.isPending || !dTrader || !dTx || !dAmount}
        >
          Зачислить
        </Button>
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Последние выводы</h2>
        <div className="max-h-48 overflow-auto text-xs space-y-1">
          {(
            withdrawals?.data as Array<{
              id: string;
              amountUsdt: unknown;
              coldWalletAddress: string;
              createdAt: string;
            }>
          )?.map((r) => (
            <div key={r.id} className="flex justify-between gap-2 border-b border-border-subtle/50 py-1">
              <span>{String(r.amountUsdt)} USDT</span>
              <span className="truncate text-text-muted">{r.coldWalletAddress}</span>
              <span className="text-text-muted">{r.createdAt?.slice(0, 10)}</span>
            </div>
          )) ?? <p className="text-text-muted">Нет данных</p>}
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Депозиты кошелька</h2>
        <div className="max-h-48 overflow-auto text-xs space-y-1">
          {(
            deposits?.data as Array<{
              id: string;
              txHash: string;
              amountUsdt: unknown;
              status: string;
            }>
          )?.map((r) => (
            <div key={r.id} className="flex justify-between gap-2 border-b border-border-subtle/50 py-1">
              <span className="truncate">{r.txHash.slice(0, 12)}…</span>
              <span>{String(r.amountUsdt)}</span>
              <span>{r.status}</span>
            </div>
          )) ?? <p className="text-text-muted">Нет данных</p>}
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Заявки на пополнение (только TRC-20)</h2>
        <p className="text-xs text-text-muted">
          Заявки трейдеров на ручное пополнение USDT через TRC-20. Проверьте и одобрите/отклоните.
        </p>

        {/* Filter */}
        <div className="flex gap-2 items-end">
          <div>
            <label className="text-xs text-text-muted block mb-1">Статус</label>
            <select
              className="rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
              value={topUpStatusFilter}
              onChange={(e) => {
                setTopUpStatusFilter(e.target.value);
                setTopUpPage(1);
              }}
            >
              <option value="">Все</option>
              <option value="PENDING">Ожидание</option>
              <option value="APPROVED">Одобрено</option>
              <option value="REJECTED">Отклонено</option>
            </select>
          </div>
        </div>

        {/* Pending requests list */}
        <div className="max-h-64 overflow-auto text-xs space-y-2">
          {topUpLoading ? (
            <p className="text-text-muted">Загрузка…</p>
          ) : topUpsList.length === 0 ? (
            <p className="text-text-muted">Заявок нет</p>
          ) : (
            topUpsList.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border-subtle/50 p-3 space-y-2"
              >
                  <div className="flex justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{req.trader.user.login ?? req.trader.user.email ?? '—'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {req.status === 'PENDING' ? 'Ожидание' : req.status === 'APPROVED' ? 'Одобрено' : 'Отклонено'}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-green-500">+{req.amountUsdt} USDT</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-muted">Network:</span>{' '}
                    <span className="font-mono">{req.network}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">TX:</span>{' '}
                    <span className="font-mono">{req.txHash.slice(0, 16)}…</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-muted">Comment:</span>{' '}
                    <span className="text-text-secondary">{req.comment || '—'}</span>
                  </div>
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle/30">
                    {approveMut.isPending ? (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing…
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            className="w-full rounded border border-border-subtle bg-bg-primary px-2 py-1 text-xs"
                            placeholder="Admin note (optional)"
                            value={approveNote}
                            onChange={(e) => setApproveNote(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => approveMut.mutate(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600"
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    )}

                    {rejectId === req.id && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 rounded border border-border-subtle bg-bg-primary px-2 py-1 text-xs"
                          placeholder="Reject reason (optional)"
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                        />
                        <button
                          onClick={() => rejectMut.mutate({ id: req.id, note: rejectNote })}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => setRejectId(null)}
                          className="px-3 py-1.5 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {req.adminNote && (
                  <div className="text-xs text-text-muted pt-1">
                    <span className="font-medium">Admin:</span> {req.adminNote}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {topUpsTotalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Total: {topUpsTotal}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setTopUpPage(p => Math.max(1, p - 1))}
                disabled={topUpPage <= 1}
                className="px-2 py-1 rounded border border-border-subtle disabled:opacity-50"
              >
                ← Prev
              </button>
              <span>{topUpPage} / {topUpsTotalPages}</span>
              <button
                onClick={() => setTopUpPage(p => Math.min(topUpsTotalPages, p + 1))}
                disabled={topUpPage >= topUpsTotalPages}
                className="px-2 py-1 rounded border border-border-subtle disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
