export const ALERT_WINDOWS = {
  CO2: {
    OPEN_SEC: parseInt(process.env.ALERT_CO2_OPEN_WINDOW_SEC ?? "300"),
    RESOLVE_SEC: parseInt(process.env.ALERT_CO2_RESOLVE_WINDOW_SEC ?? "120"),
  },
  OCCUPANCY_MAX: {
    OPEN_SEC: parseInt(process.env.ALERT_OCCUPANCY_MAX_OPEN_WINDOW_SEC ?? "120"),
    RESOLVE_SEC: parseInt(process.env.ALERT_OCCUPANCY_MAX_RESOLVE_WINDOW_SEC ?? "60"),
  },
  OCCUPANCY_UNEXPECTED: {
    OPEN_SEC: parseInt(process.env.ALERT_OCCUPANCY_UNEXPECTED_OPEN_WINDOW_SEC ?? "600"),
    RESOLVE_SEC: parseInt(process.env.ALERT_OCCUPANCY_UNEXPECTED_RESOLVE_WINDOW_SEC ?? "300"),
  },
} as const;

export const TELEMETRY_AGGREGATION_WINDOW_MIN = parseInt(
  process.env.TELEMETRY_AGGREGATION_WINDOW_MIN ?? "5"
);

export const MAX_RESERVATIONS_PER_WEEK = 3;

export const MQTT_TOPICS = {
  TELEMETRY: (siteId: string, officeId: string) =>
    `sites/${siteId}/offices/${officeId}/telemetry`,
  DESIRED: (siteId: string, officeId: string) =>
    `sites/${siteId}/offices/${officeId}/desired`,
  REPORTED: (siteId: string, officeId: string) =>
    `sites/${siteId}/offices/${officeId}/reported`,
  TELEMETRY_WILDCARD: "sites/+/offices/+/telemetry",
  REPORTED_WILDCARD: "sites/+/offices/+/reported",
} as const;
