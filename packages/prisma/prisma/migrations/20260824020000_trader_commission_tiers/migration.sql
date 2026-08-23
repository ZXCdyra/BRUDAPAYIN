-- Trader commission ladder (percent tiers per amount range)
CREATE TYPE "trader_tier_direction" AS ENUM ('PAYIN', 'PAYOUT');

CREATE TABLE "trader_commission_tiers" (
    "id" UUID NOT NULL,
    "trader_profile_id" UUID NOT NULL,
    "direction" "trader_tier_direction" NOT NULL,
    "amount_from" DECIMAL(18,4) NOT NULL,
    "amount_to" DECIMAL(18,4),
    "percent" DECIMAL(8,4) NOT NULL,

    CONSTRAINT "trader_commission_tiers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trader_commission_tiers_trader_profile_id_direction_amount_idx" ON "trader_commission_tiers"("trader_profile_id", "direction", "amount_from");

ALTER TABLE "trader_commission_tiers" ADD CONSTRAINT "trader_commission_tiers_trader_profile_id_fkey" FOREIGN KEY ("trader_profile_id") REFERENCES "trader_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;