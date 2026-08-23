'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDownCircle, FileUp, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { topupKeys } from '@/lib/query-keys';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { formatDateTime } from '@/lib/utils';

type TopUpRequest = {
  id: string;
  txHash: string;
  network: string;
  amountUsdt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string | null;
  proofFile: { originalName: string } | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
};

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'blue'> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
};

export default function TopUpPage() {
  const queryClient = useQueryClient();

  const tr = {
    title: 'Пополнение баланса',
    subtitle: 'Создайте заявку на пополнение USDT TRC-20. После отправки администрация проверит транзакцию и зачислит средства.',
    createRequest: 'Создать заявку',
    createDescription: 'Заполните информацию о переводе. Администрация проверит транзакцию и одобрит заявку.',
    txHash: 'Хеш транзакции USDT TRC-20',
    network: 'Сеть',
    amountUsdt: 'Сумма USDT',
    commentOptional: 'Комментарий (необязательно)',
    submitting: 'Отправка…',
    submitRequest: 'Отправить заявку',
    myRequests: 'Мои заявки',
    requestsSub: 'Список ваших заявок на пополнение баланса USDT (только TRC-20)',
    emptyRequests: 'Заявок пока нет',
    pagination: (total: number, page: number, totalPages: number) => `Всего: ${total}, страница ${page} из ${totalPages}`,
    colStatus: 'Статус',
    colAmount: 'Сумма',
    colNetwork: 'Сеть',
    colTxHash: 'TX Hash',
    colComment: 'Комментарий',
    colAdminNote: 'Примечание админа',
    colTime: 'Время',
    status: {
      pending: 'Ожидание',
      approved: 'Одобрено',
      rejected: 'Отклонено',
    },
  };

  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: topupKeys.myRequests(page),
    queryFn: () =>
      api.get<{ data: TopUpRequest[]; total: number; page: number; limit: number }>(
        `${internalPaths.traderTopUpRequests}?page=${page}&limit=30`,
      ),
  });

  const txList = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 30));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(internalPaths.traderTopUpRequestCreate, {
        tx_hash: txHash,
        network: 'TRC20' as const,
        amount_usdt: parseFloat(amount),
        comment: comment || undefined,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topupKeys.myRequests(page) });
      setTxHash('');
      setAmount('');
      setComment('');
      setFiles([]);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <ArrowDownCircle className="h-6 w-6" /> {tr.title}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{tr.subtitle}</p>
      </div>

      {/* Create form */}
      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-4 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary">{tr.createRequest}</h2>
        <p className="text-xs text-text-muted">{tr.createDescription}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-text-muted block mb-1">{tr.txHash}</label>
            <input
              type="text"
              className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm font-mono"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Введите хеш транзакции"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">{tr.network}</label>
            <div className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm text-text-muted">
              TRC-20 (Tron)
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">{tr.amountUsdt}</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-text-muted block mb-1">{tr.commentOptional}</label>
            <textarea
              className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (необязательно)"
              rows={2}
            />
          </div>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !txHash || !amount}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tr.submitting}
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              {tr.submitRequest}
            </>
          )}
        </button>
      </section>

      {/* Requests list */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">{tr.myRequests}</h2>
        <p className="mb-3 text-sm text-text-muted">{tr.requestsSub}</p>

        <DataTable 
          columns={[
            {
              key: 'status',
              header: tr.colStatus,
              render: (tx: TopUpRequest) => (
                <Badge color={STATUS_BADGE[tx.status] ?? 'blue'}>{tr.status[tx.status.toLowerCase() as keyof typeof tr.status]}</Badge>
              ),
            },
            {
              key: 'amount',
              header: tr.colAmount,
              className: 'text-end tabular-nums',
              render: (tx: TopUpRequest) => (
                <span className="font-mono font-semibold text-green-400">+{tx.amountUsdt} USDT</span>
              ),
            },
            {
              key: 'network',
              header: tr.colNetwork,
              render: (tx: TopUpRequest) => (
                <Badge color="blue">{tx.network}</Badge>
              ),
            },
            {
              key: 'txHash',
              header: tr.colTxHash,
              render: (tx: TopUpRequest) => (
                <span className="font-mono text-xs">{tx.txHash.slice(0, 16)}…</span>
              ),
            },
            {
              key: 'comment',
              header: tr.colComment,
              render: (tx: TopUpRequest) => (
                <span className="text-sm text-text-secondary">{tx.comment || '—'}</span>
              ),
            },
            {
              key: 'adminNote',
              header: tr.colAdminNote,
              render: (tx: TopUpRequest) => (
                <span className="text-sm text-text-muted">{tx.adminNote || '—'}</span>
              ),
            },
            {
              key: 'createdAt',
              header: tr.colTime,
              render: (tx: TopUpRequest) => (
                <span className="text-xs text-text-muted">{formatDateTime(new Date(tx.createdAt))}</span>
              ),
            },
          ]}
          data={txList}
          isLoading={isLoading}
          emptyMessage={tr.emptyRequests}
        />

        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          captionOverride={tr.pagination(total, page, totalPages)}
          variant="minimal"
        />
      </section>
    </div>
  );
}
