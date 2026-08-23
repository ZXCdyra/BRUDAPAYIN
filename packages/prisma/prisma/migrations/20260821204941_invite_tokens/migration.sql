-- DropForeignKey
ALTER TABLE "deposits" DROP CONSTRAINT "wallet_deposits_trader_id_fkey";

-- DropForeignKey
ALTER TABLE "merchant_balance_transactions" DROP CONSTRAINT "merchant_balance_transactions_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_income" DROP CONSTRAINT "platform_income_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_income" DROP CONSTRAINT "platform_income_trader_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_withdrawals" DROP CONSTRAINT "platform_withdrawals_initiated_by_fkey";

-- DropForeignKey
ALTER TABLE "requisite_groups" DROP CONSTRAINT "requisite_groups_payment_method_id_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_payout_trader_id_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_trader_id_fkey";

-- DropForeignKey
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_wallet_deposit_id_fkey";

-- DropIndex
DROP INDEX "requisites_confirmed_payin_amount_idx";

-- AlterTable
ALTER TABLE "cascade_level_debts" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cascade_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "deposits" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "credited_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "exchange_rate_logs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "source" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "merchant_balance_transactions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "merchant_payout_pool_assignments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payin_order_assignment_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payout_pool_settings" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payout_trader_balance_transactions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payout_trader_settlement_requests" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payout_trader_telegram_settings" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payout_traders" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "platform_income" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "platform_withdrawals" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "trader_wallets" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "wallet_sweep_logs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "confirmed_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "invite_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "redeemed_at" TIMESTAMP(3),
    "user_id" UUID,
    "created_by" UUID NOT NULL,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_token_key" ON "invite_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_email_key" ON "invite_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_user_id_key" ON "invite_tokens"("user_id");

-- CreateIndex
CREATE INDEX "invite_tokens_token_idx" ON "invite_tokens"("token");

-- CreateIndex
CREATE INDEX "invite_tokens_email_redeemed_at_idx" ON "invite_tokens"("email", "redeemed_at");

-- CreateIndex
CREATE INDEX "invite_tokens_expires_at_idx" ON "invite_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "merchant_balances_currency_id_idx" ON "merchant_balances"("currency_id");

-- AddForeignKey
ALTER TABLE "requisite_groups" ADD CONSTRAINT "requisite_groups_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_trader_id_fkey" FOREIGN KEY ("trader_id") REFERENCES "trader_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_payout_trader_id_fkey" FOREIGN KEY ("payout_trader_id") REFERENCES "payout_traders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_wallet_deposit_id_fkey" FOREIGN KEY ("wallet_deposit_id") REFERENCES "deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_income" ADD CONSTRAINT "platform_income_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_income" ADD CONSTRAINT "platform_income_trader_id_fkey" FOREIGN KEY ("trader_id") REFERENCES "trader_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_balance_transactions" ADD CONSTRAINT "merchant_balance_transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_trader_id_fkey" FOREIGN KEY ("trader_id") REFERENCES "trader_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_withdrawals" ADD CONSTRAINT "platform_withdrawals_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
