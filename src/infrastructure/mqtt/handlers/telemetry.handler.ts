import { PrismaClient } from '@prisma/client';
import { AlertEngine, TelemetryReading } from '../alert-engine/alert.engine';
import { TELEMETRY_AGGREGATION_WINDOW_MIN } from '../../../shared/constants/alert.constants';

// In-memory buffer keyed by spaceId — accumulates raw readings per aggregation window
const telemetryBuffers = new Map<string, TelemetryReading[]>();
const windowStartTimes = new Map<string, Date>();

export class TelemetryHandler {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly alertEngine: AlertEngine
  ) {}

  async handle(siteId: string, officeId: string, payload: string): Promise<void> {
    let reading: TelemetryReading;
    try {
      reading = JSON.parse(payload) as TelemetryReading;
    } catch {
      console.warn(`[Telemetry] Invalid JSON payload for site=${siteId} office=${officeId}`);
      return;
    }

    const space = await this.prisma.space.findFirst({
      where: { id: officeId, placeId: siteId },
    });

    if (!space) {
      console.warn(`[Telemetry] Unknown space: site=${siteId} office=${officeId}`);
      return;
    }

    await this.alertEngine.evaluate(space.id, reading);
    await this.accumulateAndAggregate(space.id, reading);
  }

  private async accumulateAndAggregate(spaceId: string, reading: TelemetryReading): Promise<void> {
    const now = new Date(reading.ts);
    const windowMs = TELEMETRY_AGGREGATION_WINDOW_MIN * 60 * 1000;

    if (!windowStartTimes.has(spaceId)) {
      windowStartTimes.set(spaceId, now);
      telemetryBuffers.set(spaceId, []);
    }

    const windowStart = windowStartTimes.get(spaceId)!;
    const buffer = telemetryBuffers.get(spaceId)!;
    buffer.push(reading);

    if (now.getTime() - windowStart.getTime() >= windowMs) {
      await this.flushAggregation(spaceId, windowStart, now, buffer);
      windowStartTimes.set(spaceId, now);
      telemetryBuffers.set(spaceId, []);
    }
  }

  private async flushAggregation(
    spaceId: string,
    windowStart: Date,
    windowEnd: Date,
    readings: TelemetryReading[]
  ): Promise<void> {
    if (readings.length === 0) return;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = (arr: number[]) => Math.max(...arr);

    await this.prisma.telemetryAggregation.create({
      data: {
        spaceId,
        windowStart,
        windowEnd,
        avgTempC: avg(readings.map((r) => r.temp_c)),
        avgHumidityPct: avg(readings.map((r) => r.humidity_pct)),
        avgCo2Ppm: avg(readings.map((r) => r.co2_ppm)),
        maxCo2Ppm: max(readings.map((r) => r.co2_ppm)),
        avgOccupancy: avg(readings.map((r) => r.occupancy)),
        maxOccupancy: max(readings.map((r) => r.occupancy)),
        avgPowerW: avg(readings.map((r) => r.power_w)),
        sampleCount: readings.length,
      },
    });

    console.log(
      `[Telemetry] Aggregated ${readings.length} readings for space ${spaceId} (window: ${TELEMETRY_AGGREGATION_WINDOW_MIN}min)`
    );
  }
}
