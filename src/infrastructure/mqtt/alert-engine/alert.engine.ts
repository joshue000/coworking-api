import { PrismaClient, AlertKind, Prisma } from '@prisma/client';
import { ALERT_WINDOWS } from '../../../shared/constants/alert.constants';
import { isWithinOfficeHours } from '../../../shared/utils/time.utils';

export interface TelemetryReading {
  ts: string;
  temp_c: number;
  humidity_pct: number;
  co2_ppm: number;
  occupancy: number;
  power_w: number;
}

interface AlertState {
  conditionSince: Date | null;
  recoverySince: Date | null;
}

const alertStates = new Map<string, Map<AlertKind, AlertState>>();

function getState(spaceId: string, kind: AlertKind): AlertState {
  if (!alertStates.has(spaceId)) alertStates.set(spaceId, new Map());
  const spaceStates = alertStates.get(spaceId)!;
  if (!spaceStates.has(kind)) spaceStates.set(kind, { conditionSince: null, recoverySince: null });
  return spaceStates.get(kind)!;
}

function setState(spaceId: string, kind: AlertKind, state: AlertState): void {
  alertStates.get(spaceId)!.set(kind, state);
}

function elapsedSec(since: Date, now: Date): number {
  return (now.getTime() - since.getTime()) / 1000;
}

export class AlertEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async evaluate(spaceId: string, reading: TelemetryReading): Promise<void> {
    const now = new Date(reading.ts);

    const [space, desiredConfig] = await Promise.all([
      this.prisma.space.findUnique({ where: { id: spaceId }, include: { place: true } }),
      this.prisma.deviceDesired.findUnique({ where: { spaceId } }),
    ]);

    if (!space) return;

    const co2Threshold = desiredConfig?.co2AlertThreshold ?? 1000;
    const timezone = space.place.timezone;

    await Promise.all([
      this.evaluateCo2(spaceId, reading, now, co2Threshold),
      this.evaluateOccupancyMax(spaceId, reading, now, space.capacity),
      this.evaluateOccupancyUnexpected(spaceId, reading, now, space, timezone),
    ]);
  }

  private async evaluateCo2(
    spaceId: string,
    reading: TelemetryReading,
    now: Date,
    threshold: number
  ): Promise<void> {
    await this.processAlertState({
      spaceId,
      kind: AlertKind.CO2,
      state: getState(spaceId, AlertKind.CO2),
      isAnomalous: reading.co2_ppm > threshold,
      now,
      openWindowSec: ALERT_WINDOWS.CO2.OPEN_SEC,
      resolveWindowSec: ALERT_WINDOWS.CO2.RESOLVE_SEC,
      immediateResolve: false,
      meta: { co2_ppm: reading.co2_ppm, threshold } as Prisma.InputJsonObject,
    });
  }

  private async evaluateOccupancyMax(
    spaceId: string,
    reading: TelemetryReading,
    now: Date,
    capacity: number
  ): Promise<void> {
    await this.processAlertState({
      spaceId,
      kind: AlertKind.OCCUPANCY_MAX,
      state: getState(spaceId, AlertKind.OCCUPANCY_MAX),
      isAnomalous: reading.occupancy > capacity,
      now,
      openWindowSec: ALERT_WINDOWS.OCCUPANCY_MAX.OPEN_SEC,
      resolveWindowSec: ALERT_WINDOWS.OCCUPANCY_MAX.RESOLVE_SEC,
      immediateResolve: false,
      meta: { occupancy: reading.occupancy, capacity } as Prisma.InputJsonObject,
    });
  }

  private async evaluateOccupancyUnexpected(
    spaceId: string,
    reading: TelemetryReading,
    now: Date,
    space: { id: string; opensAt: string; closesAt: string },
    timezone: string
  ): Promise<void> {
    const withinHours = isWithinOfficeHours(now, space.opensAt, space.closesAt, timezone);
    let isAnomalous = false;
    let reason = '';

    if (!withinHours && reading.occupancy > 0) {
      isAnomalous = true;
      reason = 'outside_office_hours';
    } else if (withinHours && reading.occupancy > 0) {
      const hasActiveReservation = await this.prisma.reservation.findFirst({
        where: {
          spaceId,
          reservationDate: {
            gte: new Date(now.toISOString().split('T')[0]),
            lte: new Date(now.toISOString().split('T')[0]),
          },
          startTime: { lte: this.toHHmm(now, timezone) },
          endTime: { gte: this.toHHmm(now, timezone) },
        },
      });
      if (!hasActiveReservation) {
        isAnomalous = true;
        reason = 'no_active_reservation';
      }
    }

    await this.processAlertState({
      spaceId,
      kind: AlertKind.OCCUPANCY_UNEXPECTED,
      state: getState(spaceId, AlertKind.OCCUPANCY_UNEXPECTED),
      isAnomalous,
      now,
      openWindowSec: ALERT_WINDOWS.OCCUPANCY_UNEXPECTED.OPEN_SEC,
      resolveWindowSec: ALERT_WINDOWS.OCCUPANCY_UNEXPECTED.RESOLVE_SEC,
      // Per README: resolves immediately when occupancy drops OR a reservation becomes active
      immediateResolve: true,
      meta: { occupancy: reading.occupancy, reason } as Prisma.InputJsonObject,
    });
  }

  private async processAlertState(opts: {
    spaceId: string;
    kind: AlertKind;
    state: AlertState;
    isAnomalous: boolean;
    now: Date;
    openWindowSec: number;
    resolveWindowSec: number;
    immediateResolve: boolean;
    meta: Prisma.InputJsonObject;
  }): Promise<void> {
    const {
      spaceId,
      kind,
      state,
      isAnomalous,
      now,
      openWindowSec,
      resolveWindowSec,
      immediateResolve,
      meta,
    } = opts;

    const activeAlert = await this.prisma.alert.findFirst({
      where: { spaceId, kind, resolvedAt: null },
    });

    if (isAnomalous) {
      state.recoverySince = null;

      if (!activeAlert) {
        if (!state.conditionSince) {
          state.conditionSince = now;
        } else if (elapsedSec(state.conditionSince, now) >= openWindowSec) {
          await this.prisma.alert.create({
            data: { spaceId, kind, startedAt: state.conditionSince, metaJson: meta },
          });
          console.log(`[AlertEngine] OPEN alert ${kind} for space ${spaceId}`, meta);
          state.conditionSince = null;
        }
      }
    } else {
      state.conditionSince = null;

      if (activeAlert) {
        if (immediateResolve) {
          await this.prisma.alert.update({
            where: { id: activeAlert.id },
            data: { resolvedAt: now },
          });
          console.log(`[AlertEngine] RESOLVED alert ${kind} for space ${spaceId} (immediate)`);
          state.recoverySince = null;
        } else {
          if (!state.recoverySince) {
            state.recoverySince = now;
          } else if (elapsedSec(state.recoverySince, now) >= resolveWindowSec) {
            await this.prisma.alert.update({
              where: { id: activeAlert.id },
              data: { resolvedAt: now },
            });
            console.log(`[AlertEngine] RESOLVED alert ${kind} for space ${spaceId}`);
            state.recoverySince = null;
          }
        }
      } else {
        state.recoverySince = null;
      }
    }

    setState(spaceId, kind, state);
  }

  private toHHmm(date: Date, timezone: string): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}
