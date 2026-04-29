-- Add client_name with a temporary default for existing rows
ALTER TABLE "reservations" ADD COLUMN "client_name" TEXT NOT NULL DEFAULT 'Unknown';
-- Remove the default so future inserts must provide a value
ALTER TABLE "reservations" ALTER COLUMN "client_name" DROP DEFAULT;
