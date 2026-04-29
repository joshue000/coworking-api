-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('CO2', 'OCCUPANCY_MAX', 'OCCUPANCY_UNEXPECTED');

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Panama',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "opens_at" TEXT NOT NULL,
    "closes_at" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "client_email" TEXT NOT NULL,
    "reservation_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_desired" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "sampling_interval_sec" INTEGER NOT NULL DEFAULT 10,
    "co2_alert_threshold" INTEGER NOT NULL DEFAULT 1000,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_desired_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_reported" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "sampling_interval_sec" INTEGER,
    "co2_alert_threshold" INTEGER,
    "firmware_version" TEXT,
    "reported_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_reported_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_aggregations" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "avg_temp_c" DOUBLE PRECISION,
    "avg_humidity_pct" DOUBLE PRECISION,
    "avg_co2_ppm" DOUBLE PRECISION,
    "max_co2_ppm" DOUBLE PRECISION,
    "avg_occupancy" DOUBLE PRECISION,
    "max_occupancy" INTEGER,
    "avg_power_w" DOUBLE PRECISION,
    "sample_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "telemetry_aggregations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "meta_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservations_space_id_reservation_date_idx" ON "reservations"("space_id", "reservation_date");

-- CreateIndex
CREATE INDEX "reservations_place_id_reservation_date_idx" ON "reservations"("place_id", "reservation_date");

-- CreateIndex
CREATE INDEX "reservations_client_email_reservation_date_idx" ON "reservations"("client_email", "reservation_date");

-- CreateIndex
CREATE UNIQUE INDEX "device_desired_space_id_key" ON "device_desired"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_reported_space_id_key" ON "device_reported"("space_id");

-- CreateIndex
CREATE INDEX "telemetry_aggregations_space_id_window_start_idx" ON "telemetry_aggregations"("space_id", "window_start");

-- CreateIndex
CREATE INDEX "alerts_space_id_kind_idx" ON "alerts"("space_id", "kind");

-- CreateIndex
CREATE INDEX "alerts_space_id_started_at_idx" ON "alerts"("space_id", "started_at");

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_desired" ADD CONSTRAINT "device_desired_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_reported" ADD CONSTRAINT "device_reported_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_aggregations" ADD CONSTRAINT "telemetry_aggregations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
