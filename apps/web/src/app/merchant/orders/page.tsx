'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedTextFilter } from '@/lib/hooks/use-debounced-value';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FiltersToggleButton,
  ListPageHeader,
  SearchStatusRow,
} from '@/components/ui/list-page-tools';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { merchantKeys } from '@/lib/query-keys';
import { buildQueryString, formatDateTime } from '@/lib/utils';
import { isPayinCabinetOrderRow } from '@/lib/is-payin-cabinet-order-row';
import { DataTable } from '@/components/ui/data-table';
import { OrderIdCopyCell } from '@/components/ui/order-id-copy-cell';
import { PayinRequisiteTableCell } from '@/components/ui/payin-requisite-table-cell';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { FilterInput } from '@/components/ui/filters';
import {
  ORDER_LIST_UI_TAB,
  orderListUiTabToDirection,
  type OrderListUiTab,
  type PaymentDetailsShortDto,
} from '@p2p/shared';
import { payinStatusFilterOptions, payoutStatusFilterOptions } from '@/lib/order-status-ui';

const MERCHANT_ORDER_PAGE_SIZE = 50;

interface MerchantOrder {
  id: string;
  externalId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  customerEmail: string | null;
  createdAt: string;
  completedAt: string | null;
  payment_detail?: PaymentDetailsShortDto | null;
  trader_processing_method?: 'CARD' | 'FORK' | null;
}

interface MerchantOrdersResponse {
  data: MerchantOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MerchantOrdersPage() {
  const [tab, setTab] = useState<OrderListUiTab>(ORDER_LIST_UI_TAB.PAY_IN);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const {
    value: searchInput,
    setValue: setSearchInput,
    debounced: debouncedSearch,
  } = useDebouncedTextFilter();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const direction = orderListUiTabToDirection(tab);

  useEffect(() => {
    setPage(1);
  }, [direction, statusFilter, debouncedSearch, dateFrom, dateTo]);

  const statusFilterOptions = useMemo(
    () => (tab === ORDER_LIST_UI_TAB.PAY_IN ? payinStatusFilterOptions : payoutStatusFilterOptions),
    [tab],
  );

  const { data, isLoading } = useQuery<MerchantOrdersResponse>({
    queryKey: merchantKeys.orders({
      direction,
      statusFilter,
      debouncedSearch,
      dateFrom,
      dateTo,
      page,
    }),
    queryFn: async () => {
      const qs = buildQueryString({
        direction,
        page,
        limit: MERCHANT_ORDER_PAGE_SIZE,
        status: statusFilter,
        search: debouncedSearch,
        dateFrom,
        dateTo,
      });
      return api.get<MerchantOrdersResponse>(internalPaths.merchantOrders(qs));
    },
  });

  const orders = Array.isArray(data?.data) ? data.data : [];
  const totalPages = data?.totalPages ?? 1;
  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'font-mono tabular-nums text-end',
      render: (row: MerchantOrder) => <OrderIdCopyCell id={row.id} label="ID заявки" />,
    },
    {
      key: 'externalId',
      header: 'Внешний ID',
      className: 'font-mono tabular-nums text-end',
      render: (row: MerchantOrder) => (
        <OrderIdCopyCell id={row.externalId ?? ''} label="Внешний ID" />
      ),
    },
    {
      key: 'amount',
      header: 'Сумма',
      className: 'text-end tabular-nums',
      render: (row: MerchantOrder) => (
        <span className="font-mono text-text-primary">
          {row.amount.toLocaleString()} {row.currency}
        </span>
      ),
    },
    {
      key: 'requisite',
      header: 'Реквизит',
      className: 'min-w-[7rem]',
      render: (row: MerchantOrder) =>
        isPayinCabinetOrderRow(row) ? (
          <PayinRequisiteTableCell row={row} />
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    { key: 'paymentMethod', header: 'Метод' },
    {
      key: 'status',
      header: 'Статус',
      className: 'text-center',
      render: (row: MerchantOrder) => <StatusBadge status={row.status} />,
    },
    {
      key: 'customerEmail',
      header: 'Плательщик',
      render: (row: MerchantOrder) => (
        <span className="text-text-muted text-xs">{row.customerEmail ?? '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Создана',
      render: (row: MerchantOrder) => (
        <span className="text-xs text-text-muted">
          {formatDateTime(new Date(row.createdAt))}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Завершена',
      render: (row: MerchantOrder) => (
        <span className="text-xs text-text-muted">
          {row.completedAt
            ? formatDateTime(new Date(row.completedAt))
            : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageHeader
        title={
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ArrowLeftRight size={24} />
            Заявки
          </h1>
        }
        description="Просмотр и отслеживание ваших заявок"
        actions={
          <>
            <Tabs
              tabs={[
                { key: ORDER_LIST_UI_TAB.PAY_IN, label: 'Приём' },
                { key: ORDER_LIST_UI_TAB.PAY_OUT, label: 'Выплаты' },
              ]}
              active={tab}
              onChange={(k) => {
                setTab(k as OrderListUiTab);
                setStatusFilter('');
                setPage(1);
              }}
            />
            <FiltersToggleButton
              expanded={showFilters}
              onToggle={() => setShowFilters((v) => !v)}
            />
          </>
        }
      />

      <SearchStatusRow
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ID или внешний ID..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusFilterOptions}
      />

      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FilterInput
              label="С даты"
              type="date"
              value={dateFrom}
              onChange={setDateFrom}
            />
            <FilterInput
              label="По дату"
              type="date"
              value={dateTo}
              onChange={setDateTo}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              Сбросить даты
            </Button>
          </div>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={orders}
        keyExtractor={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="Заявки не найдены"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
