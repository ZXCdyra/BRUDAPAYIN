'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrderIdUrlParam } from '@/lib/hooks/use-order-id-url-param';
import { useDebouncedTextFilter } from '@/lib/hooks/use-debounced-value';
import { ArrowLeftRight, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { adminKeys } from '@/lib/query-keys';
import { DataTable } from '@/components/ui/data-table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { FilterInput, FilterSelect } from '@/components/ui/filters';
import {
  FilterFieldsRow,
  FiltersToggleButton,
  ListPageHeader,
} from '@/components/ui/list-page-tools';
import { IconButton } from '@/components/ui/icon-button';
import { OrderIdCopyCell } from '@/components/ui/order-id-copy-cell';
import { PayinRequisiteTableCell } from '@/components/ui/payin-requisite-table-cell';
import { Modal } from '@/components/ui/modal';
import { StatusHistoryList } from '@/components/ui/status-history-list';
import { StaffOrderStatusCell } from '@/components/ui/staff-order-status-cell';
import { isPayinCabinetOrderRow } from '@/lib/is-payin-cabinet-order-row';
import { buildQueryString, formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ORDER_LIST_UI_TAB,
  isOrderListPayOutTab,
  orderListUiTabToDirection,
  type OrderListUiTab,
  type PaymentDetailsShortDto,
} from '@p2p/shared';
import {
  badgeVariantForPayin,
  badgeVariantForPayout,
  nextPayinStatuses,
  nextPayoutStatuses,
  payinStatusFilterOptions,
  payoutStatusFilterOptions,
} from '@/lib/order-status-ui';
import {
  adminOrderStatusConfirmCopy,
  type PendingAdminOrderStatusChange,
} from '@/lib/admin-order-status-confirm';
import { PendingConfirmDialog } from '@/components/ui/pending-confirm-dialog';

const ADMIN_ORDERS_PAGE_SIZE = 20;

/** Priority manual outcomes requested for the admin console (shown when the state machine allows them). */
const PAYIN_MANUAL_ACTIONS: { status: string; label: string }[] = [
  { status: 'PAID', label: 'Удачная' },
  { status: 'EXPIRED', label: 'Истекшая' },
  { status: 'CANCELED', label: 'Отменена' },
];

const PAYOUT_MANUAL_ACTIONS: { status: string; label: string }[] = [
  { status: 'COMPLETED', label: 'Удачная' },
  { status: 'FAILED', label: 'Неудачная' },
  { status: 'CANCELED', label: 'Отменена' },
];

const ORDER_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Order {
  id: string;
  externalId: string;
  type: string;
  merchantName: string;
  traderName: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  payment_detail?: PaymentDetailsShortDto | null;
  trader_processing_method?: 'CARD' | 'FORK' | null;
}

interface TraderOption {
  id: string;
  name: string;
}

interface OrderDetails {
  id: string;
  type: string;
  merchantName: string;
  traderName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  traderProcessingMethod?: string | null;
  forkExchangeReference?: string | null;
  forkChatProofFileIds?: string[];
  requisites?: { bank: string; cardNumber: string };
  statusHistory: { status: string; timestamp: string; actor: string }[];
}

function AdminOrdersPageContent() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<OrderListUiTab>(ORDER_LIST_UI_TAB.PAY_IN);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const {
    value: merchantFilter,
    setValue: setMerchantFilter,
    debounced: debouncedMerchantFilter,
  } = useDebouncedTextFilter();
  const {
    value: traderFilter,
    setValue: setTraderFilter,
    debounced: debouncedTraderFilter,
  } = useDebouncedTextFilter();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [selectedTrader, setSelectedTrader] = useState('');
  const [pendingStatusChange, setPendingStatusChange] =
    useState<PendingAdminOrderStatusChange | null>(null);

  const { orderId: detailOrder, openOrderDetail, closeOrderDetail } = useOrderIdUrlParam({
    validate: (s) => ORDER_ID_UUID_RE.test(s),
  });

  const direction = orderListUiTabToDirection(tab);

  useEffect(() => {
    setPage(1);
  }, [direction, statusFilter, debouncedMerchantFilter, debouncedTraderFilter, dateFrom, dateTo]);

  const statusFilterOptions = useMemo(
    () => (tab === ORDER_LIST_UI_TAB.PAY_IN ? payinStatusFilterOptions : payoutStatusFilterOptions),
    [tab],
  );

  interface AdminOrdersResponse {
    data: Order[];
    total: number;
    page: number;
    totalPages: number;
  }

  const { data: ordersData, isLoading } = useQuery<AdminOrdersResponse>({
    queryKey: adminKeys.orders({
      direction,
      statusFilter,
      merchantFilter: debouncedMerchantFilter,
      traderFilter: debouncedTraderFilter,
      dateFrom,
      dateTo,
      page,
    }),
    queryFn: () => {
      const qs = buildQueryString({
        direction,
        page,
        limit: ADMIN_ORDERS_PAGE_SIZE,
        status: statusFilter,
        merchant: debouncedMerchantFilter,
        trader: debouncedTraderFilter,
        dateFrom,
        dateTo,
      });
      return api.get<AdminOrdersResponse>(internalPaths.adminOrders(qs));
    },
  });
  const orders = ordersData?.data ?? [];
  const totalPages = ordersData?.totalPages ?? 1;

  const { data: traders = [] } = useQuery<TraderOption[]>({
    queryKey: adminKeys.tradersOptions(),
    queryFn: async () => {
      const res = await api.get<{
        data: Array<{ id: string; user: { login?: string; email?: string | null } }>;
      }>(`${internalPaths.traders}?page=1&limit=500`);
      return res.data.map((t) => ({ id: t.id, name: t.user.login ?? t.user.email ?? '-' }));
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, traderId }: { orderId: string; traderId: string }) =>
      api.post(internalPaths.payoutAssign, { orderId, traderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersScope });
      setAssigningOrder(null);
      setSelectedTrader('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(internalPaths.adminOrderStatus(id), { status }),
    onSuccess: () => {
      setPendingStatusChange(null);
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersScope });
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetailsScope });
    },
  });

  const { data: details } = useQuery({
    queryKey: adminKeys.orderDetails(detailOrder),
    queryFn: () => api.get<OrderDetails>(internalPaths.adminOrder(detailOrder!)),
    enabled: !!detailOrder,
  });

  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'font-mono tabular-nums text-end',
      render: (row: Order) => <OrderIdCopyCell id={row.id} label="Order ID" />,
    },
    {
      key: 'externalId',
      header: 'Внешний ID',
      className: 'font-mono tabular-nums text-end',
      render: (row: Order) => (
        <OrderIdCopyCell id={row.externalId ?? ''} label="Внешний ID" />
      ),
    },
    {
      key: 'merchantName',
      header: 'Мерчант',
      render: (row: Order) => <span className="text-text-primary">{row.merchantName}</span>,
    },
    {
      key: 'traderName',
      header: 'Трейдер',
      render: (row: Order) => (
        <span className={row.traderName ? 'text-text-primary' : 'text-text-muted'}>
          {row.traderName ?? 'Не назначен'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Сумма',
      className: 'text-end tabular-nums',
      render: (row: Order) => (
        <span className="font-mono text-text-primary">
          {row.amount.toLocaleString()} {row.currency}
        </span>
      ),
    },
    {
      key: 'requisite',
      header: 'Реквизит',
      className: 'min-w-[7rem]',
      render: (row: Order) =>
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
      render: (row: Order) => (
        <StaffOrderStatusCell
          orderId={row.id}
          status={row.status}
          direction={tab === ORDER_LIST_UI_TAB.PAY_IN ? 'payin' : 'payout'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Создана',
      render: (row: Order) => (
        <span className="text-xs text-text-muted">
          {formatDateTime(new Date(row.createdAt))}
        </span>
      ),
    },
    {
      key: 'view',
      header: '',
      className: 'w-12 text-end',
      render: (row: Order) => (
        <IconButton
          label="View order details"
          onClick={(e) => {
            e.stopPropagation();
            openOrderDetail(row.id);
          }}
        >
          <Eye className="h-4 w-4" />
        </IconButton>
      ),
    },
    {
      key: 'statusActions',
      header: 'Сменить статус',
      className: 'text-end',
      render: (row: Order) => {
        const isPayin = tab === ORDER_LIST_UI_TAB.PAY_IN;
        const allowed = new Set(
          (isPayin ? nextPayinStatuses(row.status) : nextPayoutStatuses(row.status)) as string[],
        );
        const actions = (isPayin ? PAYIN_MANUAL_ACTIONS : PAYOUT_MANUAL_ACTIONS).filter(
          (a) => allowed.has(a.status) && a.status !== row.status,
        );
        if (actions.length === 0) return null;
        return (
          <div
            className="flex flex-wrap items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((a) => (
              <Button
                key={a.status}
                size="sm"
                variant="secondary"
                className="!px-2 !py-1 text-[10px] font-medium"
                loading={
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.id === row.id &&
                  updateStatusMutation.variables?.status === a.status
                }
                onClick={() =>
                  setPendingStatusChange({
                    id: row.id,
                    status: a.status,
                    orderType: isPayin ? 'PAYIN' : 'PAYOUT',
                    amount: row.amount,
                    currency: row.currency,
                  })
                }
              >
                {a.label}
              </Button>
            ))}
          </div>
        );
      },
    },
    ...(isOrderListPayOutTab(tab)
        ? [
          {
            key: 'assign' as const,
            header: '',
            className: 'text-end',
            render: (row: Order) =>
              !row.traderName ? (
                assigningOrder === row.id ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Select
                      options={[
                        { value: '', label: 'Select trader' },
                        ...traders.map((t) => ({ value: t.id, label: t.name })),
                      ]}
                      value={selectedTrader}
                      onChange={(e) => setSelectedTrader(e.target.value)}
                      className="min-h-9 min-w-[12rem] max-w-[16rem] !py-1.5 !text-xs"
                    />
                    <Button
                      size="sm"
                      disabled={!selectedTrader}
                      loading={assignMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        assignMutation.mutate({
                          orderId: row.id,
                          traderId: selectedTrader,
                        });
                      }}
                    >
                      Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssigningOrder(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssigningOrder(row.id);
                    }}
                  >
                    Assign
                  </Button>
                )
              ) : null,
          },
        ]
      : []),
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
        description="Просмотр и управление всеми заявками платформы"
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

      <FilterFieldsRow>
        <div className="w-full shrink-0 sm:w-44">
          <FilterSelect
            label="Статус"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusFilterOptions}
          />
        </div>
        <FilterInput
          label="Мерчант"
          value={merchantFilter}
          onChange={setMerchantFilter}
          placeholder="Имя мерчанта..."
          className="min-w-0 w-full sm:flex-1 sm:basis-[12rem] sm:max-w-xs"
        />
        <FilterInput
          label="Трейдер"
          value={traderFilter}
          onChange={setTraderFilter}
          placeholder="Имя трейдера..."
          className="min-w-0 w-full sm:flex-1 sm:basis-[12rem] sm:max-w-xs"
        />
      </FilterFieldsRow>

      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FilterInput label="С даты" type="date" value={dateFrom} onChange={setDateFrom} />
            <FilterInput label="По дату" type="date" value={dateTo} onChange={setDateTo} />
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

      <PendingConfirmDialog
        pending={pendingStatusChange}
        onOpenChange={(open) => !open && setPendingStatusChange(null)}
        getCopy={adminOrderStatusConfirmCopy}
        loading={updateStatusMutation.isPending}
        onConfirm={({ id, status }) => updateStatusMutation.mutate({ id, status })}
      />

      <Modal
        open={!!detailOrder}
        onClose={closeOrderDetail}
        title={`Order — ${detailOrder?.slice(0, 12) ?? ''}`}
        className="max-w-2xl"
      >
        {details && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted">Type</p>
                <p className="font-medium text-text-primary">{details.type}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Status</p>
                <Badge
                  variant={
                    details.type === 'PAYOUT'
                      ? badgeVariantForPayout(details.status)
                      : badgeVariantForPayin(details.status)
                  }
                >
                  {details.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-text-muted">Amount</p>
                <p className="font-mono font-medium text-text-primary">
                  {formatCurrency(details.amount, details.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Created</p>
                <p className="text-sm text-text-secondary">
                  {formatDateTime(new Date(details.createdAt))}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Merchant</p>
                <p className="text-sm text-text-primary">{details.merchantName}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Trader</p>
                <p className="text-sm text-text-primary">{details.traderName || '—'}</p>
              </div>
              {details.type === 'PAYIN' && details.traderProcessingMethod ? (
                <div>
                  <p className="text-xs text-text-muted">Pay-In routing</p>
                  <p className="text-sm text-text-primary">{details.traderProcessingMethod}</p>
                </div>
              ) : null}
              {details.type === 'PAYIN' && details.forkExchangeReference ? (
                <div className="col-span-2">
                  <p className="text-xs text-text-muted">Exchange reference (FORK)</p>
                  <p className="font-mono text-sm text-text-primary break-all">
                    {details.forkExchangeReference}
                  </p>
                </div>
              ) : null}
              {details.type === 'PAYIN' &&
              details.forkChatProofFileIds &&
              details.forkChatProofFileIds.length > 0 ? (
                <div className="col-span-2">
                  <p className="text-xs text-text-muted">Fork chat proof file IDs</p>
                  <p className="font-mono text-xs text-text-secondary break-all">
                    {details.forkChatProofFileIds.join(', ')}
                  </p>
                </div>
              ) : null}
            </div>

            {details.requisites ? (
              <div className="rounded-lg border border-border-primary bg-surface-primary p-3">
                <p className="mb-1 text-xs text-text-muted">Requisites</p>
                <p className="text-sm text-text-primary">{details.requisites.bank}</p>
                <p className="font-mono text-sm text-text-secondary">
                  {details.requisites.cardNumber}
                </p>
              </div>
            ) : null}

            {details.statusHistory?.length > 0 ? (
              <StatusHistoryList entries={details.statusHistory} />
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl animate-fade-in space-y-6 p-6 text-text-muted">
          Loading…
        </div>
      }
    >
      <AdminOrdersPageContent />
    </Suspense>
  );
}
