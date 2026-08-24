'use client';

import { BookOpen, Code2, Link2, KeyRound, ShieldCheck, CheckCircle2, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: <KeyRound className="h-5 w-5" />,
    title: 'Регистрация мерчанта',
    desc: 'Создайте аккаунт на платформе BrudaPay и получите доступ к API ключам для работы с интеграцией.',
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: 'Генерация API-ключей',
    desc: 'В разделе «API Keys» создайте пару ключей: public_key и secret_key. Public-key отправляйте клиенту, secret_key храните на своём бэкенде.',
  },
  {
    icon: <Link2 className="h-5 w-5" />,
    title: 'Базовая структура запросов',
    desc: 'Все запросы отправляются на базовый URL API с заголовком Authorization: Bearer {your_api_key}',
    code: 'POST /api/external/v1/payin/upload_order\nAuthorization: Bearer {public_key}\nX-Signature: {HMAC-SHA256}',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'HMAC-подпись запросов',
    desc: 'Для безопасности все API-запросы должны быть подписаны HMAC-SHA256. Сигнатура формируется из timestamp + body + secret_key.',
    code: 'const signature = HMAC_SHA256(\n  timestamp + JSON.stringify(body),\n  secret_key\n);',
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: 'Статусы заказов',
    desc: 'Pay-In: PENDING → NEW → VERIFIED → PAID/UNDERPAID/OVERPAID → COMPLETED\nPay-Out: PENDING → NEW → PROCESSING → COMPLETED/FAILED',
  },
];

export default function MerchantDocumentationPage() {
  const [copiedCode, setCopiedCode] = useState('');

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(key);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-text-primary">
          <BookOpen className="h-6 w-6 text-accent-blue" />
          Документация по интеграции
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Полное руководство по подключению вашего мерчант-аккаунта к платформе BrudaPay.
        </p>
      </div>

      {/* Overview */}
      <div className="rounded-xl border border-border-primary bg-bg-secondary/60 p-5">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Обзор API</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Платформа BrudaPay предоставляет REST API для автоматизации процесса обработки платежей.
          Мерчанты могут создавать заказы на пополнение (Pay-In) и вывод средств (Pay-Out),
          отслеживать их статус и управлять балансами через API.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
            <p className="text-xs text-text-muted">Base URL</p>
            <p className="font-mono text-text-primary">{process.env.NEXT_PUBLIC_API_URL || 'https://api.p2p-processing-dev.com'}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
            <p className="text-xs text-text-muted">Формат ответа</p>
            <p className="font-mono text-text-primary">JSON (application/json)</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
            <p className="text-xs text-text-muted">Аутентификация</p>
            <p className="font-mono text-text-primary">Bearer Token + HMAC-SHA256</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-primary/50 p-3">
            <p className="text-xs text-text-muted">Rate Limits</p>
            <p className="font-mono text-text-primary">10 req/s (API), 1 req/s (Login)</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="rounded-xl border border-border-primary bg-bg-secondary/40 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-accent-blue">ШАГ {idx + 1}</span>
                  <h3 className="text-base font-semibold text-text-primary">{step.title}</h3>
                </div>
                <p className="mt-1 text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                {step.code && (
                  <div className="mt-3 relative rounded-lg border border-border-subtle bg-[#1e1e2e] p-3 font-mono text-xs text-text-secondary overflow-x-auto">
                    <button
                      onClick={() => copyToClipboard(step.code!, String(idx))}
                      className={cn(
                        'absolute right-2 top-2 flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] transition-all duration-200',
                        copiedCode === String(idx)
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/10 text-text-muted hover:bg-white/20 hover:text-text-primary',
                      )}
                    >
                      {copiedCode === String(idx) ? (
                        <>
                          <Check className="h-3 w-3" /> Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Копировать
                        </>
                      )}
                    </button>
                    <pre className="whitespace-pre-wrap">{step.code}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/5 p-5">
        <h3 className="text-base font-semibold text-text-primary">Поддержка</h3>
        <p className="mt-1 text-sm text-text-secondary">
          По вопросам интеграции обращайтесь в Telegram: <a href="https://t.me/brudapay_support" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">@brudapay_support</a>
        </p>
      </div>
    </div>
  );
}
