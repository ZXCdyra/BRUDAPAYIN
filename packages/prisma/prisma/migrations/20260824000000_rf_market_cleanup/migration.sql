-- RF market cleanup: deactivate legacy non-RF reference data (idempotent).
-- Rows are deactivated, not deleted, so historical orders/balances keep their FKs intact.

-- Legacy Ukrainian banks
UPDATE "banks" SET "is_active" = false
WHERE "name" IN ('Monobank', 'PrivatBank', 'PUMB', 'Oshchadbank', 'Sportbank');

-- Legacy IBAN payment method tied to UA geo
UPDATE "payment_methods" SET "is_active" = false
WHERE "name" = 'IBAN_P2P';

-- Only Russia stays active
UPDATE "countries" SET "is_active" = false
WHERE "code" <> 'RU';

-- Only RUB + USDT stay active
UPDATE "currencies" SET "is_active" = false
WHERE "code" NOT IN ('RUB', 'USDT');
