'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, FileUp, Loader2, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { internalPaths } from '@/lib/internal-api';
import { topupKeys } from '@/lib/query-keys';
import { PLATFORM_USDT_TRC20_NETWORK, PLATFORM_USDT_TRC20_WALLET } from '@/lib/platform';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';

export function TraderTopUpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { copied, copy } = useCopyToClipboard();
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setTxHash('');
      setAmount('');
      setComment('');
      setDone(false);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      api.post(internalPaths.traderTopUpRequestCreate, {
        tx_hash: txHash,
        network: 'TRC20' as const,
        amount_usdt: parseFloat(amount),
        comment: comment || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['topup-requests'] });
      setDone(true);
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg space-y-4 rounded-xl border border-border-primary bg-bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">Пополнение баланса</h2>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-text-primary">
              Заявка отправлена. Администрация проверит транзакцию и зачислит средства —
              следите за статусом в разделе «Пополнение».
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Готово
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              Переведите USDT в сети TRC-20 на кошелёк платформы, затем нажмите «Я пополнил»
              и укажите хеш транзакции.
            </p>

            <div className="space-y-2 rounded-lg border border-border-primary bg-bg-primary p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                USDT · {PLATFORM_USDT_TRC20_NETWORK}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-sm text-accent">
                  {PLATFORM_USDT_TRC20_WALLET}
                </code>
                <button
                  type="button"
                  onClick={() => copy(PLATFORM_USDT_TRC20_WALLET, 'wallet')}
                  className="shrink-0 rounded-md p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                  aria-label="Скопировать адрес кошелька"
                >
                  {copied === 'wallet' ? (
                    <Check size={16} className="text-accent-green" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="text-xs text-red-400/80">
                Отправляйте только USDT в сети TRC-20. Средства после подтверждений сети.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Сумма (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Хеш транзакции</label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Хеш из блокчейна"
                  className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">
                  Комментарий (необязательно)
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Например: пополнение с биржи Bybit"
                  className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
                />
              </div>
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-500">
                Не удалось отправить заявку. Проверьте данные и попробуйте снова.
              </p>
            )}

            <button
              disabled={mutation.isPending || !txHash || !amount}
              onClick={() => mutation.mutate()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Отправляем…
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" /> Я пополнил
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
