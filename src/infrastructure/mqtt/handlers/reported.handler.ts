import { PrismaClient } from '@prisma/client';

interface ReportedPayload {
  ts: string;
  samplingIntervalSec: number;
  co2_alert_threshold: number;
  firmwareVersion: string;
}

export class ReportedHandler {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(siteId: string, officeId: string, payload: string): Promise<void> {
    let reported: ReportedPayload;
    try {
      reported = JSON.parse(payload) as ReportedPayload;
    } catch {
      console.warn(`[Reported] Invalid JSON payload for site=${siteId} office=${officeId}`);
      return;
    }

    const space = await this.prisma.space.findFirst({
      where: { id: officeId, placeId: siteId },
    });

    if (!space) {
      console.warn(`[Reported] Unknown space: site=${siteId} office=${officeId}`);
      return;
    }

    await this.prisma.deviceReported.upsert({
      where: { spaceId: space.id },
      update: {
        samplingIntervalSec: reported.samplingIntervalSec,
        co2AlertThreshold: reported.co2_alert_threshold,
        firmwareVersion: reported.firmwareVersion,
        reportedAt: new Date(reported.ts),
      },
      create: {
        spaceId: space.id,
        samplingIntervalSec: reported.samplingIntervalSec,
        co2AlertThreshold: reported.co2_alert_threshold,
        firmwareVersion: reported.firmwareVersion,
        reportedAt: new Date(reported.ts),
      },
    });

    console.log(`[Reported] Updated digital twin (reported) for space ${space.id}`);
  }
}
