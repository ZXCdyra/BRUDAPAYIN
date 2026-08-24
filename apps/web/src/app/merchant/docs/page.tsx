'use client';

import { BookOpen } from 'lucide-react';

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-primary p-4 text-xs leading-relaxed text-text-secondary">
      <code>{children}</code>
    </pre>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-primary bg-bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

const SIGN_SNIPPET = `import { createHmac } from 'node:crypto';

const PUBLIC_KEY = 'pk_payin_xxxxxxxx';   // из кабинета → API Keys
const SECRET_KEY = 'sk_payin_xxxxxxxx';   // показывается один раз при создании

const body = JSON.stringify({
  request_id: 'order-123',          // уникальный ID заявки у вас
  amount: 5000,
  currency: 'RUB',
  user_full_name: 'Иван Иванов',
  callback_url: 'https://ваш-сайт/webhooks/p2p',
  nonce: Date.now(),                // обязателен, защита от повторов
});

const apiPayload = Buffer.from(body, 'utf8').toString('base64');
const signature = createHmac('sha512', SECRET_KEY).update(apiPayload).digest('hex');

await fetch('https://<домен-платформы>/api/external/v1/payin/upload_order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': PUBLIC_KEY,
    'X-API-Payload': apiPayload,
    'X-API-Signature': signature,
  },
  body,
});`;

const PAYIN_RESPONSE = `{
  "order": {
    "id": "543b09a2-1c59-4f45-b4fa-75c8cd7c6b86",
    "request_id": "order-123",
    "status": "NEW",
    "currency": "RUB",
    "amount": 5000,
    "commission": 250,
    "commission_percent": 5,
    "partner_amount": 4750,
    "requisite_number": "4276550012345678",
    "requisite_owner": "Иван И.",
    "bank": "Т-Банк",
    "payment_detail": {
      "type": "CARD",
      "number": "4276550012345678",
      "owner": "Иван И.",
      "bank_name": "Т-Банк"
    }
  },
  "form_uri": "https://платформа/pay/543b09a2-…"   // ссылка-оплата для покупателя
}`;

const PAYOUT_REQUEST = `{
  "request_id": "payout-777",
  "currency": "RUB",
  "amount": 12000,
  "details": {
    "type": "CARD",              // CARD или IBAN
    "number": "2200700123456789",
    "owner": "Пётр Петров",      // опционально
    "code": "TBANK"              // код банка, опционально
  },
  "callback_url": "https://ваш-сайт/webhooks/p2p",
  "nonce": 1787522664000
}`;

const WEBHOOK_EXAMPLE = `// POST https://ваш-сайт/webhooks/p2p
// Заголовки: X-Webhook-Signature, X-Webhook-Id, Content-Type: application/json
{
  "method": "payin.order.paid",
  "timestamp": 1787522664,
  "data": {
    "id": "543b09a2-…",
    "request_id": "order-123",
    "status": "PAID"
  }
}

// Проверка подписи: HMAC-SHA512 от сырого тела запроса секретным ключом (sk_…),
// результат в заголовке X-Webhook-Signature. Ответьте 2xx — иначе пойдут повторы.`;

export default function MerchantDocsPage() {
  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <BookOpen size={24} />
          Документация API
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Интеграция вашего магазина с платформой: приём платежей (Pay-In) и выплаты (Pay-Out).
        </p>
      </div>

      <Section title="1. Ключи и авторизация">
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
          <li>Ключи создаются в разделе <b>API Keys</b>: пара публичный (<code>pk_…</code>) / секретный (<code>sk_…</code>) на каждое направление.</li>
          <li>Секретный ключ показывается один раз — сохраните его сразу.</li>
          <li>Все запросы — только <code>POST</code>, тело в формате JSON.</li>
          <li><code>nonce</code> в теле обязателен (миллисекунды) — защита от повторной отправки.</li>
        </ul>
        <Code>{SIGN_SNIPPET}</Code>
      </Section>

      <Section title="2. Приём платежа (Pay-In)">
        <p className="text-sm text-text-secondary">
          <code>POST /api/external/v1/payin/upload_order</code> — создать заявку на оплату.
          Платформа подберёт карту трейдера и вернёт реквизиты для покупателя.
        </p>
        <p className="text-sm text-text-muted">Тело запроса:</p>
        <table className="w-full text-sm">
          <tbody className="[&_td]:border [&_td]:border-border-subtle [&_td]:px-3 [&_td]:py-1.5">
            <tr><td className="font-mono">request_id</td><td>Ваш ID заявки, уникальный</td></tr>
            <tr><td className="font-mono">amount</td><td>Сумма в валюте заказа</td></tr>
            <tr><td className="font-mono">currency</td><td>Валюта, например <code>RUB</code></td></tr>
            <tr><td className="font-mono">user_full_name</td><td>ФИО плательщика</td></tr>
            <tr><td className="font-mono">callback_url</td><td>(опц.) URL для вебхуков</td></tr>
            <tr><td className="font-mono">nonce</td><td>Миллисекунды, обязательное поле</td></tr>
          </tbody>
        </table>
        <p className="text-sm text-text-muted">Ответ:</p>
        <Code>{PAYIN_RESPONSE}</Code>
        <p className="text-sm text-text-secondary">
          Покажите покупателю <code>form_uri</code> или реквизиты напрямую. После оплаты статус
          станет <code>PAID</code>.
        </p>
        <p className="text-sm text-text-muted">Статусы Pay-In:</p>
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-text-secondary">
          <li><code>NEW</code> — заявка создана, ждёт оплаты</li>
          <li><code>PAID</code> — успешная, средства зачислены на ваш баланс</li>
          <li><code>CANCELED</code> — отменена (истекла по таймауту или отменена вручную)</li>
          <li><code>UNDERPAID</code> / <code>OVERPAID</code> / <code>APPEAL</code> — спорные, требуется разбирательство</li>
        </ul>
        <p className="text-sm text-text-secondary">
          Статус заявки: <code>POST /api/external/v1/payin/order_info</code> с телом{' '}
          <code>{`{ id или request_id, nonce }`}</code>. Информация о магазине и балансах:{' '}
          <code>POST /api/external/v1/payin/info</code>.
        </p>
      </Section>

      <Section title="3. Выплаты (Pay-Out)">
        <p className="text-sm text-text-secondary">
          <code>POST /api/external/v1/payout/order_upload</code> — выплатить физлицу.
          Сумма списывается с баланса мерчанта.
        </p>
        <Code>{PAYOUT_REQUEST}</Code>
        <p className="text-sm text-text-muted">Статусы Pay-Out:</p>
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-text-secondary">
          <li><code>PENDING</code> / <code>NEW</code> — в очереди на выплату</li>
          <li><code>PROCESSING</code> — трейдер выполняет перевод</li>
          <li><code>COMPLETED</code> — удачная, получателю отправлено</li>
          <li><code>FAILED</code> — не удалась (вернётся на баланс)</li>
          <li><code>CANCELED</code> — отменена</li>
        </ul>
        <p className="text-sm text-text-secondary">
          Статус: <code>POST /api/external/v1/payout/order_info</code> с{' '}
          <code>{`{ id или request_id, nonce }`}</code>.
        </p>
      </Section>

      <Section title="4. Вебхуки">
        <p className="text-sm text-text-secondary">
          Если в заявке указан <code>callback_url</code>, платформа присылает события об изменении
          статуса. Подпись — HMAC-SHA512 от сырого тела запроса вашим секретным ключом.
        </p>
        <Code>{WEBHOOK_EXAMPLE}</Code>
        <p className="text-xs text-text-muted">
          Не доставленные вебхуки повторяются автоматически; журнал доставок виден в разделе Webhooks.
        </p>
      </Section>

      <Section title="5. Ошибки">
        <p className="text-sm text-text-secondary">
          Все ошибки возвращаются в едином формате:
        </p>
        <Code>{`{
  "timestamp": "2026-08-23T21:54:13.621Z",
  "message": "Validation failed",
  "code": "BAD_REQUEST",
  "details": { "errors": ["property amount must be a number"] }
}`}</Code>
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-text-secondary">
          <li><code>401</code> — неверная подпись / просроченный или повторный nonce</li>
          <li><code>403</code> — ключ не активен или не подходит направлению</li>
          <li><code>400</code> — ошибка валидации полей</li>
          <li><code>429</code> — слишком много запросов</li>
        </ul>
      </Section>

      <Section title="6. Рекомендации">
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
          <li>Храните <code>sk_…</code> только на сервере — не публикуйте во фронтенде.</li>
          <li>Генерируйте <code>request_id</code> так, чтобы он был уникальным навсегда.</li>
          <li>Не полагайтесь только на вебхуки — периодически сверяйте статус через <code>order_info</code>.</li>
          <li>Для отладки используйте Playground в кабинете администратора.</li>
        </ul>
      </Section>
    </div>
  );
}
