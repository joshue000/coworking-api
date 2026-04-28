import "dotenv/config";
import prisma from "./infrastructure/database/prisma.client";
import { connectMqtt } from "./infrastructure/mqtt/mqtt.client";
import { setupMqttSubscriptions } from "./infrastructure/mqtt/mqtt.subscriber";
import { createApp } from "./infrastructure/http/server";

import { PrismaPlaceRepository } from "./infrastructure/database/repositories/prisma-place.repository";
import { PrismaSpaceRepository } from "./infrastructure/database/repositories/prisma-space.repository";
import { PrismaReservationRepository } from "./infrastructure/database/repositories/prisma-reservation.repository";

import { PlaceUseCases } from "./application/use-cases/places/place.use-cases";
import { SpaceUseCases } from "./application/use-cases/spaces/space.use-cases";
import { ReservationUseCases } from "./application/use-cases/reservations/reservation.use-cases";

import { PlaceController } from "./infrastructure/controllers/place.controller";
import { SpaceController } from "./infrastructure/controllers/space.controller";
import { ReservationController } from "./infrastructure/controllers/reservation.controller";
import { IoTController } from "./infrastructure/controllers/iot.controller";

import { AlertEngine } from "./infrastructure/mqtt/alert-engine/alert.engine";
import { TelemetryHandler } from "./infrastructure/mqtt/handlers/telemetry.handler";
import { ReportedHandler } from "./infrastructure/mqtt/handlers/reported.handler";
import { DesiredPublisher } from "./infrastructure/mqtt/publishers/desired.publisher";

async function bootstrap(): Promise<void> {
  await prisma.$connect();
  console.log("[DB] Connected to PostgreSQL");

  // Repositories
  const placeRepo = new PrismaPlaceRepository(prisma);
  const spaceRepo = new PrismaSpaceRepository(prisma);
  const reservationRepo = new PrismaReservationRepository(prisma);

  // Use cases
  const placeUseCases = new PlaceUseCases(placeRepo);
  const spaceUseCases = new SpaceUseCases(spaceRepo, placeRepo);
  const reservationUseCases = new ReservationUseCases(reservationRepo, spaceRepo);

  // MQTT
  const mqttClient = await connectMqtt();
  const desiredPublisher = new DesiredPublisher(mqttClient);
  const alertEngine = new AlertEngine(prisma);
  const telemetryHandler = new TelemetryHandler(prisma, alertEngine);
  const reportedHandler = new ReportedHandler(prisma);

  await setupMqttSubscriptions(mqttClient, telemetryHandler, reportedHandler);

  // Re-publish retained desired config for all spaces on startup
  // so simulators that reconnect immediately get their last known config
  const allDesired = await prisma.deviceDesired.findMany({ include: { space: true } });
  for (const desired of allDesired) {
    await desiredPublisher.publish(desired.space.placeId, desired.spaceId, {
      samplingIntervalSec: desired.samplingIntervalSec,
      co2AlertThreshold: desired.co2AlertThreshold,
    });
  }
  if (allDesired.length > 0) {
    console.log(`[MQTT] Re-published desired config for ${allDesired.length} space(s)`);
  }

  // HTTP Controllers
  const placeController = new PlaceController(placeUseCases);
  const spaceController = new SpaceController(spaceUseCases);
  const reservationController = new ReservationController(reservationUseCases);
  const iotController = new IoTController(prisma, desiredPublisher);

  const app = createApp(placeController, spaceController, reservationController, iotController);

  const port = parseInt(process.env.PORT ?? "3000");
  app.listen(port, () => {
    console.log(`[HTTP] Server running on http://localhost:${port}`);
    console.log(`[HTTP] API docs at http://localhost:${port}/api-docs`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[App] Shutting down...");
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("[App] Fatal error during startup:", err);
  process.exit(1);
});
