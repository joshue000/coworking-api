import { execSync } from "child_process";

export default async function globalSetup() {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    "postgresql://coworking_user:coworking_pass@localhost:5432/coworking_test";
  process.env.API_KEY = "test-api-key";
  process.env.NODE_ENV = "test";
  process.env.MQTT_BROKER_URL = "mqtt://localhost:1883";

  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env },
      stdio: "inherit",
    });
  } catch (err) {
    console.warn("[Test Setup] Migration failed — DB may not be available, skipping integration tests.");
  }
}
