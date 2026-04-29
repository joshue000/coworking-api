import { MqttClient } from 'mqtt';
import { MQTT_TOPICS } from '../../../shared/constants/alert.constants';

export interface DesiredPayload {
  samplingIntervalSec: number;
  co2AlertThreshold: number;
}

export class DesiredPublisher {
  constructor(private readonly mqttClient: MqttClient) {}

  async publish(siteId: string, officeId: string, payload: DesiredPayload): Promise<void> {
    const topic = MQTT_TOPICS.DESIRED(siteId, officeId);
    // Simulator expects snake_case keys per README spec
    const message = JSON.stringify({
      samplingIntervalSec: payload.samplingIntervalSec,
      co2_alert_threshold: payload.co2AlertThreshold,
    });

    await this.mqttClient.publishAsync(topic, message, { retain: true, qos: 1 });
    console.log(`[MQTT] Published desired config to ${topic}:`, message);
  }
}
