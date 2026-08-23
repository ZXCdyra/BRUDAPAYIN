'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Direction = 'PAYIN' | 'PAYOUT';

interface TierRow {
  amount_from: string;
  amount_to: string;
  percent: string;
}

interface TiersResponse {
  traderId: string;
  tiers: Array<{
    id: string;
    direction: Direction;
    amount_from: number;
    amount_to: number | null;
    percent: number;
  }>;
}

const emptyRows: Record<Direction, TierRow[]> = {
  PAYIN: [],
  PAYOUT: [],
};

function toRows(
  tiers: TiersResponse['tiers'],
  direction: Direction,
): TierRow[] {
  return tiers
    .filter((t) => t.direction === direction)
    .map((t) => ({
      amount_from: String(t.amount_from),
      amount_to: t.amount_to === null ? '' : String(t.amount_to),
      percent: String(t.percent),
    }));
}

/**
 * «Лесенка процентов» трейдера: диапазоны сумм → процент трейдера.
 * Пустой список = используется плоская ставка из модели баланса.
 */
export function TraderCommissionTiersPanel({
  traderId,
  canEdit,
}: {
  traderId: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Record<Direction, TierRow[]>>(emptyRows);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<TiersResponse>({
    queryKey: ['trader-commission-tiers', traderId],
    queryFn: () => api.get<TiersResponse>(internalPaths.traderCommissionTiers(traderId)),
    enabled: !!traderId,
  });

  useEffect(() => {
    if (data) {
      setRows({ PAYIN: toRows(data.tiers, 'PAYIN'), PAYOUT: toRows(data.tiers, 'PAYOUT') });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (direction: Direction) =>
      api.put(internalPaths.traderCommissionTiers(traderId), {
        direction,
        tiers: rows[direction]
          .map((r) => ({
            amountFrom: Number(r.amount_from),
            ...(r.amount_to.trim() === '' ? {} : { amountTo: Number(r.amount_to) }),
            percent: Number(r.percent),
          }))
          .filter((t) => Number.isFinite(t.amountFrom) && Number.isFinite(t.percent)),
      }),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['trader-commission-tiers', traderId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Не удалось сохранить лесенку'),
  });

  const updateRow = (dir: Direction, idx: number, patch: Partial<TierRow>) => {
    setRows((prev) => ({
      ...prev,
      [dir]: prev[dir].map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));
  };

  const addRow = (dir: Direction) => {
    setRows((prev) => ({ ...prev, [dir]: [...prev[dir], { amount_from: '', amount_to: '', percent: '' }] }));
  };

  const removeRow = (dir: Direction, idx: number) => {
    setRows((prev) => ({ ...prev, [dir]: prev[dir].filter((_, i) => i !== idx) }));
  };

  const renderDirection = (dir: Direction) => (
    <div className="space-y-3 rounded-xl border border-border-primary bg-bg-card/40 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Лесенка процентов · {dir === 'PAYIN' ? 'Pay-In' : 'Pay-Out'}
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            Сумма заказа в RUB → процент трейдера. Пустой список = плоская ставка из модели баланса.
            Диапазоны не должны пересекаться.
          </p>
        </div>
        {canEdit && (
          <Button type="button" size="sm" variant="ghost" onClick={() => addRow(dir)}>
            <Plus className="mr-1 h-4 w-4" /> Добавить
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Загрузка…</p>
      ) : rows[dir].length === 0 ? (
        <p className="text-sm text-text-muted">Тиры не заданы — действует плоская ставка.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-text-muted">
            <span>Сумма от</span>
            <span>Сумма до (пусто = ∞)</span>
            <span>Процент</span>
            <span />
          </div>
          {rows[dir].map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
              <Input inputMode="decimal" value={row.amount_from} onChange={(e) => updateRow(dir, idx, { amount_from: e.target.value })} disabled={!canEdit} />
              <Input inputMode="decimal" value={row.amount_to} onChange={(e) => updateRow(dir, idx, { amount_to: e.target.value })} disabled={!canEdit} placeholder="∞" />
              <Input inputMode="decimal" value={row.percent} onChange={(e) => updateRow(dir, idx, { percent: e.target.value })} disabled={!canEdit} />
              {canEdit ? (
                <Button type="button" size="sm" variant="danger" onClick={() => removeRow(dir, idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <span className="w-8" />
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && rows[dir].length > 0 && (
        <Button
          type="button"
          size="sm"
          loading={saveMutation.isPending && saveMutation.variables === dir}
          onClick={() => saveMutation.mutate(dir)}
        >
          Сохранить ({dir === 'PAYIN' ? 'Pay-In' : 'Pay-Out'})
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {renderDirection('PAYIN')}
      {renderDirection('PAYOUT')}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
