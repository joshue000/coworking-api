import { MqttClient } from "mqtt";
import { MQTT_TOPICS } from "../../shared/constants/alert.constants";
import { TelemetryHandler } from "./handlers/telemetry.handler";
import { ReportedHandler } from "./handlers/reported.handler";

// Parses topic segments for wildcard patterns: sites/+/offices/+/{suffix}
function parseTopic(topic: string): { siteId: string; officeId: string; suffix: string } | null {
  const parts = topic.split("/");
  if (parts.length !== 5 || parts[0] !== "sites" || parts[2] !== "offices") return null;
  return { siteId: parts[1], officeId: parts[3], suffix: parts[4] };
}

export async function setupMqttSubscriptions(
  mqttClient: MqttClient,
  telemetryHandler: TelemetryHandler,
  reportedHandler: ReportedHandler
): Promise<void> {
  await mqttClient.subscribeAsync(MQTT_TOPICS.TELEMETRY_WILDCARD, { qos: 1 });
  await mqttClient.subscribeAsync(MQTT_TOPICS.REPORTED_WILDCARD, { qos: 1 });

  console.log("[MQTT] Subscribed to telemetry and reported topics");

  mqttClient.on("message", async (topic, message) => {
    const parsed = parseTopic(topic);
    if (!parsed) return;

    const payload = message.toString();
    const { siteId, officeId, suffix } = parsed;

    try {
      if (suffix === "telemetry") {
        await telemetryHandler.handle(siteId, officeId, payload);
      } else if (suffix === "reported") {
        await reportedHandler.handle(siteId, officeId, payload);
      }
    } catch (err) {
      console.error(`[MQTT] Error processing message on topic ${topic}:`, err);
    }
  });
}
