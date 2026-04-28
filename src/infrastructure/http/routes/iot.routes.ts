import { Router } from "express";
import { IoTController } from "../../controllers/iot.controller";

export function createIoTRouter(controller: IoTController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/iot/spaces/{spaceId}/status:
   *   get:
   *     tags: [IoT]
   *     summary: Get full IoT status for a space (telemetry, digital twin, active alerts)
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: spaceId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Space IoT status
   *       404:
   *         description: Space not found
   */
  router.get("/spaces/:spaceId/status", controller.getSpaceStatus);

  /**
   * @openapi
   * /api/iot/spaces/{spaceId}/desired:
   *   put:
   *     tags: [IoT]
   *     summary: Update desired configuration for a space device (publishes to MQTT)
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: spaceId
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               samplingIntervalSec: { type: integer, minimum: 1, maximum: 3600 }
   *               co2AlertThreshold: { type: integer, minimum: 100, maximum: 5000 }
   *     responses:
   *       200:
   *         description: Desired config updated and published to MQTT
   *       404:
   *         description: Space not found
   */
  router.put("/spaces/:spaceId/desired", controller.updateDesired);

  /**
   * @openapi
   * /api/iot/spaces/{spaceId}/alerts:
   *   get:
   *     tags: [IoT]
   *     summary: List alerts for a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: spaceId
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 20 }
   *     responses:
   *       200:
   *         description: Paginated list of alerts
   */
  router.get("/spaces/:spaceId/alerts", controller.getAlerts);

  /**
   * @openapi
   * /api/iot/spaces/{spaceId}/telemetry:
   *   get:
   *     tags: [IoT]
   *     summary: List telemetry aggregations for a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: spaceId
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 20 }
   *     responses:
   *       200:
   *         description: Paginated telemetry aggregations
   */
  router.get("/spaces/:spaceId/telemetry", controller.getTelemetry);

  return router;
}
