'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

type OrderRow = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
};

type TopUpRow = {
  id: string;
  txHash: string;
  network: string;
  amountUsdt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdminOrdersPage() {
  const t = useTranslations('Admin.Orders');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showTopUpTab, setShowTopUpTab] = useState(false);

  // Fetch orders
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('search', search);
      return api.get<{ items: OrderRow[]; total: number }>(`/api/admin/orders?${params}`);
    },
  });

  // Fetch top-up requests
  const { data: topUpData, isLoading: topUpLoading } = useQuery({
    queryKey: ['admin-topup-requests', page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      return api.get<{ data: TopUpRow[]; total: number }>(`/api/admin/topup-requests?${params}`);
    },
  });

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, comment }: { orderId: string; status: string; comment?: string }) =>
      api.post(`/api/admin/orders/${orderId}/status`, { status, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Статус заказа обновлён');
    },
    onError: () => {
      toast.error('Не удалось обновить статус');
    },
  });

  // Approve top-up
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/topup-requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topup-requests'] });
      toast.success('Заявка на пополнение одобрена');
    },
    onError: () => {
      toast.error('Не удалось одобрить заявку');
    },
  });

  // Reject top-up
  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/topup-requests/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topup-requests'] });
      toast.success('Заявка на пополнение отклонена');
    },
    onError: () => {
      toast.error('Не удалось отклонить заявку');
    },
  });

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 30));

  const topUps = topUpData?.data ?? [];
  const topUpTotal = topUpData?.total ?? 0;
  const topUpTotalPages = Math.max(1, Math.ceil(topUpTotal / 30));

  const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'blue'> = {
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    COMPLETED: 'green',
    CANCELED: 'red',
    EXPIRED: 'yellow',
  };

  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Ожидание',
    APPROVED: 'Одобрено',
    REJECTED: 'Отклонено',
    COMPLETED: 'Удачная',
    CANCELED: 'Отменена',
    EXPIRED: 'Истекшая',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-sm text-text-muted mt-1">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-primary">
        <button
          onClick={() => setShowTopUpTab(false)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            !showTopUpTab
              ? 'border-accent-blue text-accent-blue'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Сделки
        </button>
        <button
          onClick={() => setShowTopUpTab(true)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            showTopUpTab
              ? 'border-accent-blue text-accent-blue'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Заявки на пополнение ({topUpData?.data?.filter((t) => t.status === 'PENDING').length ?? 0})
        </button>
      </div>

      {!showTopUpTab ? (
        <>
          {/* Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Поиск по ID заказа..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-bg-primary pl-10 pr-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Orders table */}
          <DataTable
            columns={[
              {
                key: 'id',
                header: 'ID',
                render: (order: OrderRow) => (
                  <span className="font-mono text-xs">{order.id.slice(0, 12)}…</span>
                ),
              },
              {
                key: 'status',
                header: 'Статус',
                render: (order: OrderRow) => (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent-blue/10 text-accent-blue">
                    {(STATUS_LABEL[order.status] || order.status).slice(0, 20)}
                  </span>
                ),
              },
              {
                key: 'amount',
                header: 'Сумма',
                className: 'text-end tabular-nums',
                render: (order: OrderRow) => (
                  <span className="font-mono font-semibold text-text-primary">
                    {order.amount} {order.currency}
                  </span>
                ),
              },
              {
                key: 'created_at',
                header: 'Создан',
                render: (order: OrderRow) => (
                  <span className="text-xs text-text-muted">{formatDate(order.created_at)}</span>
                ),
              },
              {
                key: 'actions',
                header: 'Действия',
                className: 'text-end',
                render: (order: OrderRow) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'COMPLETED', comment: 'Удачная' })}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Удачная
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'EXPIRED', comment: 'Истекшая' })}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-50"
                    >
                      <Clock className="h-3 w-3" />
                      Истекшая
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'CANCELED', comment: 'Отменена' })}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3" />
                      Отменена
                    </button>
                  </div>
                ),
              },
            ]}
            data={orders}
            isLoading={isLoading}
            emptyMessage={t('emptyOrders')}
          />

          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            variant="minimal"
          />
        </>
      ) : (
        <>
          {/* Top-up requests table */}
          <DataTable
            columns={[
              {
                key: 'status',
                header: 'Статус',
                render: (tx: TopUpRow) => (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent-blue/10 text-accent-blue">
                    {STATUS_LABEL[tx.status] || tx.status}
                  </span>
                ),
              },
              {
                key: 'amount',
                header: 'Сумма',
                className: 'text-end tabular-nums',
                render: (tx: TopUpRow) => (
                  <span className="font-mono font-semibold text-green-400">+{tx.amountUsdt} USDT</span>
                ),
              },
              {
                key: 'network',
                header: 'Сеть',
                render: (tx: TopUpRow) => (
                  <span className="inline-flex rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                    {tx.network}
                  </span>
                ),
              },
              {
                key: 'txHash',
                header: 'TX Hash',
                render: (tx: TopUpRow) => (
                  <span className="font-mono text-xs">{tx.txHash.slice(0, 16)}…</span>
                ),
              },
              {
                key: 'comment',
                header: 'Комментарий',
                render: (tx: TopUpRow) => (
                  <span className="text-sm text-text-secondary">{tx.comment || '—'}</span>
                ),
              },
              {
                key: 'createdAt',
                header: 'Время',
                render: (tx: TopUpRow) => (
                  <span className="text-xs text-text-muted">{formatDate(new Date(tx.createdAt))}</span>
                ),
              },
              {
                key: 'actions',
                header: 'Действия',
                className: 'text-end',
                render: (tx: TopUpRow) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => approveMutation.mutate(tx.id)}
                      disabled={approveMutation.isPending || tx.status !== 'PENDING'}
                      className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Одобрить
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(tx.id)}
                      disabled={rejectMutation.isPending || tx.status !== 'PENDING'}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3" />
                      Отклонить
                    </button>
                  </div>
                ),
              },
            ]}
            data={topUps}
            isLoading={topUpLoading}
            emptyMessage="Заявок на пополнение пока нет"
          />

          <PaginationControls
            page={page}
            totalPages={topUpTotalPages}
            onPageChange={setPage}
            totalItems={topUpTotal}
            variant="minimal"
          />
        </>
      )}
    </div>
  );
}
