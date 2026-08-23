-- CreateEnum
CREATE TYPE "TopUpRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "topup_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trader_id" UUID NOT NULL,
    "tx_hash" VARCHAR(128) NOT NULL,
    "network" "BlockchainNetwork" NOT NULL,
    "amount_usdt" DECIMAL(18,6) NOT NULL,
    "status" "TopUpRequestStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "proof_file_id" UUID,
    "admin_id" UUID,
    "admin_note" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topup_requests_trader_id_idx" ON "topup_requests"("trader_id");

-- CreateIndex
CREATE INDEX "topup_requests_status_idx" ON "topup_requests"("status");

-- CreateIndex
CREATE INDEX "topup_requests_created_at_idx" ON "topup_requests"("created_at");

-- AddForeignKey
ALTER TABLE "topup_requests" ADD CONSTRAINT "topup_requests_trader_id_fkey" FOREIGN KEY ("trader_id") REFERENCES "trader_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topup_requests" ADD CONSTRAINT "topup_requests_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topup_requests" ADD CONSTRAINT "topup_requests_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
