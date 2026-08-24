-- Add EXPIRED status to Pay-In orders (autoclose timeout / manual admin decision).
ALTER TYPE "PayinStatus" ADD VALUE IF NOT EXISTS 'EXPIRED' AFTER 'CANCELED';
