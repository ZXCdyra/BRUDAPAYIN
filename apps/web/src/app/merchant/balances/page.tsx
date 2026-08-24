'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedTextFilter } from '@/lib/hooks/use-debounced-value';
import { Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { merchantKeys } from '@/lib/query-keys';
import { FilterBar, FilterInput } from '@/components/ui/filters';
import { DataTable } from '@/components/ui/data-table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Badge } from '@/components/ui/badge';
import { currencyCodeFromUnknown } from '@/lib/currency-code';
import { formatDateTime } from '@/lib/utils';

interface BalanceRow {
  currency: unknown;
  available: number;
  frozen: number;
}

interface BalanceSummary {
  dateFrom: string | null;
  dateTo: string | null;
  payin_volume_fiat_paid: number;
  payout_volume_fiat_completed: number;
  payin_commission_fiat: number;
  payout_commission_fiat_on_completed: number;
  payout_commission_fiat_on_all_created_in_period: number;
}

interface MerchantBalanceTx {
  id: string;
  type: string;
  amount: string;
  currency: unknown;
  referenceId: string | null;
  comment: string | null;
  createdAt: string;
}

interface MerchantSettlementRow {
  id: string;
  amount: string | number;
  currency: unknown;
  manualRate: string | number | null;
  usdtEquivalent: string | number | null;
  usdtAddress: string | null;
  note: string | null;
  createdAt: string;
}

const TX_LABEL: Record<string, string> = {
  PAYIN_CREDIT: 'Зачисление по приёму',
  PAYOUT_DEBIT: 'Списание по выплате',
  PAYOUT_REFUND: 'Возврат по выплате',
  MANUAL_CREDIT: 'Ручное зачисление',
  MANUAL_DEBIT: 'Ручное списание',
  TOP_UP: 'Пополнение',
  SETTLEMENT: 'Вывод (сеттлмент)',
};

export default function MerchantBalancesPage() {
  const [sumFrom, setSumFrom] = useState('');
  const [sumTo, setSumTo] = useState('');
  const [txFrom, setTxFrom] = useState('');
  const [txTo, setTxTo] = useState('');
  const {
    value: txType,
    setValue: setTxType,
    debounced: debouncedTxType,
  } = useDebouncedTextFilter();
  const [txPage, setTxPage] = useState(1);

  useEffect(() => {
    setTxPage(1);
  }, [debouncedTxType, txFrom, txTo]);

  const summaryQs =
    sumFrom || sumTo
      ? `${new URLSearchParams({
          ...(sumFrom ? { dateFrom: sumFrom } : {}),
          ...(sumTo ? { dateTo: sumTo } : {}),
        }).toString()}`
      : '';

  const { data: balancesRaw, isLoading: balancesLoading } = useQuery({
    queryKey: merchantKeys.balances(),
    queryFn: () => api.get(internalPaths.merchantBalances),
  });
  const balances = Array.isArray(balancesRaw) ? balancesRaw : [];

  const { data: summary, isLoading: sumLoading } = useQuery<BalanceSummary>({
    queryKey: merchantKeys.balanceSummary(sumFrom, sumTo),
    queryFn: () => api.get(internalPaths.merchantBalanceSummary(summaryQs)),
  });

  const txParams = new URLSearchParams({
    page: String(txPage),
    limit: '25',
  });
  if (txFrom) txParams.set('dateFrom', txFrom);
  if (txTo) txParams.set('dateTo', txTo);
  if (debouncedTxType) txParams.set('type', debouncedTxType.toUpperCase());

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: merchantKeys.balanceTransactions(txPage, txFrom, txTo, debouncedTxType),
    queryFn: () =>
      api.get<{ data: MerchantBalanceTx[]; total: number; page: number; limit: number }>(
        internalPaths.merchantBalanceTransactions(txParams.toString()),
      ),
  });

  const { data: settlementResp, isLoading: settlementLoading } = useQuery({
    queryKey: merchantKeys.settlementsHistory(),
    queryFn: () =>
      api.get<{ data: MerchantSettlementRow[]; total: number }>(
        internalPaths.merchantSettlements('page=1&limit=50'),
      ),
  });

  const txList = txData?.data ?? [];
  const txTotal = txData?.total ?? 0;
  const txLimit = txData?.limit ?? 25;
  const txTotalPages = Math.ceil(txTotal / txLimit);

  const settlementsList = settlementResp?.data ?? [];

  const settlementColumns = [
    {
      key: 'amount',
      header: 'Списано (фиат)',
      className: 'text-end font-mono text-sm',
      render: (r: MerchantSettlementRow) => (
        <span>
          {Number(r.amount).toLocaleString()} {currencyCodeFromUnknown(r.currency)}
        </span>
      ),
    },
    {
      key: 'rate',
      header: 'Курс (ручной)',
      render: (r: MerchantSettlementRow) => (
        <span className="font-mono text-xs text-text-secondary">
          {r.manualRate != null ? Number(r.manualRate).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'usdt',
      header: 'Отправлено USDT',
      className: 'text-end font-mono text-xs',
      render: (r: MerchantSettlementRow) => (
        <span>
          {r.usdtEquivalent != null ? Number(r.usdtEquivalent).toLocaleString() : '—'} USDT
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Адрес USDT',
      render: (r: MerchantSettlementRow) => (
        <span className="font-mono text-[10px] break-all text-text-muted max-w-[200px] inline-block">
          {r.usdtAddress ?? '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Дата',
      render: (r: MerchantSettlementRow) => (
        <span className="text-xs text-text-muted">
          {formatDateTime(new Date(r.createdAt))}
        </span>
      ),
    },
  ];

  const txColumns = [
    {
      key: 'type',
      header: 'Тип',
      render: (r: MerchantBalanceTx) => (
        <Badge color="blue">{TX_LABEL[r.type] ?? r.type}</Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Сумма',
      className: 'text-end font-mono text-sm',
      render: (r: MerchantBalanceTx) => (
        <span>
          {Number(r.amount).toLocaleString()} {currencyCodeFromUnknown(r.currency)}
        </span>
      ),
    },
    {
      key: 'comment',
      header: 'Комментарий / ссылка',
      render: (r: MerchantBalanceTx) => (
        <span className="text-xs text-text-secondary truncate max-w-[200px] block">
          {r.comment || r.referenceId?.slice(0, 8) || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Время',
      render: (r: MerchantBalanceTx) => (
        <span className="text-xs text-text-muted">
          {formatDateTime(new Date(r.createdAt))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Wallet size={24} />
          Балансы
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Фиатные балансы по валютам; итоги за период суммируются в валюте каждой заявки без конвертации.
          Выводы и комиссии ниже — в тех же номинальных единицах. Полная история операций — внизу.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balancesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-card border border-border-primary rounded-xl p-5"
            >
              <div className="h-4 w-16 bg-bg-tertiary rounded mb-3" />
              <div className="h-7 w-24 bg-bg-tertiary rounded mb-2" />
            </div>
          ))
        ) : (
          balances.map((b, idx) => {
            const curCode = currencyCodeFromUnknown(b.currency);
            const frozen = b.frozen ?? 0;
            return (
              <div
                key={curCode || `bal-${idx}`}
                className="bg-bg-card border border-border-primary rounded-xl p-5"
              >
                <p className="text-sm text-text-muted mb-1">{curCode}</p>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">Доступно</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {b.available.toLocaleString()}
                </p>
                <div className="mt-2 text-xs text-text-muted">
                  Заморожено:{' '}
                  <span
                    className={
                      frozen > 0 ? 'text-accent-yellow font-mono' : 'font-mono text-text-secondary'
                    }
                  >
                    {frozen.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Итоги за период</h2>
        <FilterBar>
          <FilterInput
            type="date"
            label="С"
            value={sumFrom}
            onChange={setSumFrom}
            className="w-40"
          />
          <FilterInput type="date" label="По" value={sumTo} onChange={setSumTo} className="w-40" />
        </FilterBar>
        {sumLoading || !summary ? (
          <p className="text-sm text-text-muted">Загрузка…</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-text-muted text-xs">Оборот приёма (оплаченные)</p>
              <p className="font-mono">{summary.payin_volume_fiat_paid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Оборот выплат (завершённые)</p>
              <p className="font-mono">{summary.payout_volume_fiat_completed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Комиссия по приёму (платформа)</p>
              <p className="font-mono">{summary.payin_commission_fiat.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Комиссия по выплатам (завершённые)</p>
              <p className="font-mono">
                {summary.payout_commission_fiat_on_completed.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Выводы средств</h2>
        <p className="text-xs text-text-muted leading-relaxed">
          Строки фиксируются при подтверждении выводов операторами (ручной курс + USDT). Заявки на
          вывод оформляются через вашу поддержку вне этого кабинета.
        </p>
        <DataTable
          columns={settlementColumns}
          data={settlementsList}
          isLoading={settlementLoading}
          emptyMessage="Выводов пока нет"
        />
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Операции по балансу</h2>
        <FilterBar>
          <FilterInput
            type="date"
            label="С"
            value={txFrom}
            onChange={(v) => {
              setTxFrom(v);
              setTxPage(1);
            }}
            className="w-40"
          />
          <FilterInput
            type="date"
            label="По"
            value={txTo}
            onChange={(v) => {
              setTxTo(v);
              setTxPage(1);
            }}
            className="w-40"
          />
          <FilterInput
            label="Тип"
            value={txType}
            onChange={setTxType}
            placeholder="PAYIN_CREDIT"
            className="w-40"
          />
        </FilterBar>
        <DataTable
          columns={txColumns}
          data={txList}
          isLoading={txLoading}
          emptyMessage="Операций нет"
        />
        <PaginationControls
          page={txPage}
          totalPages={txTotalPages}
          onPageChange={setTxPage}
          captionOverride={`Total: ${txTotal} · ${txPage} / ${txTotalPages}`}
          variant="minimal"
        />
      </section>
    </div>
  );
}
