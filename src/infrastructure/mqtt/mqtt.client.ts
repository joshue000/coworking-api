import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | null = null;

export function getMqttClient(): MqttClient {
  if (!client) {
    throw new Error('MQTT client not initialized. Call connectMqtt() first.');
  }
  return client;
}

export async function connectMqtt(): Promise<MqttClient> {
  return new Promise((resolve, reject) => {
    const brokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
    const clientId = process.env.MQTT_CLIENT_ID ?? 'coworking-api';

    client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      console.log(`[MQTT] Connected to broker at ${brokerUrl}`);
      resolve(client!);
    });

    client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err.message);
      reject(err);
    });

    client.on('reconnect', () => {
      console.log('[MQTT] Reconnecting...');
    });

    client.on('offline', () => {
      console.warn('[MQTT] Client offline');
    });
  });
}

export async function disconnectMqtt(): Promise<void> {
  if (client) {
    await client.endAsync();
    client = null;
  }
}
