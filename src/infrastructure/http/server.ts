import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { apiKeyMiddleware } from "./middlewares/api-key.middleware";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware";
import { createPlaceRouter } from "./routes/place.routes";
import { createSpaceRouter } from "./routes/space.routes";
import { createReservationRouter } from "./routes/reservation.routes";
import { createIoTRouter } from "./routes/iot.routes";
import { PlaceController } from "../controllers/place.controller";
import { SpaceController } from "../controllers/space.controller";
import { ReservationController } from "../controllers/reservation.controller";
import { IoTController } from "../controllers/iot.controller";

export function createApp(
  placeController: PlaceController,
  spaceController: SpaceController,
  reservationController: ReservationController,
  iotController: IoTController
): Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/api", apiKeyMiddleware);
  app.use("/api/places", createPlaceRouter(placeController));
  app.use("/api/spaces", createSpaceRouter(spaceController));
  app.use("/api/reservations", createReservationRouter(reservationController));
  app.use("/api/iot", createIoTRouter(iotController));

  app.use(errorHandlerMiddleware);

  return app;
}
