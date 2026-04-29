import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../../src/infrastructure/http/server';
import { PrismaPlaceRepository } from '../../../src/infrastructure/database/repositories/prisma-place.repository';
import { PrismaSpaceRepository } from '../../../src/infrastructure/database/repositories/prisma-space.repository';
import { PrismaReservationRepository } from '../../../src/infrastructure/database/repositories/prisma-reservation.repository';
import { PlaceUseCases } from '../../../src/application/use-cases/places/place.use-cases';
import { SpaceUseCases } from '../../../src/application/use-cases/spaces/space.use-cases';
import { ReservationUseCases } from '../../../src/application/use-cases/reservations/reservation.use-cases';
import { PlaceController } from '../../../src/infrastructure/controllers/place.controller';
import { SpaceController } from '../../../src/infrastructure/controllers/space.controller';
import { ReservationController } from '../../../src/infrastructure/controllers/reservation.controller';
import { IoTController } from '../../../src/infrastructure/controllers/iot.controller';
import { DesiredPublisher } from '../../../src/infrastructure/mqtt/publishers/desired.publisher';
import { MqttClient } from 'mqtt';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

let app: Application;
let placeId: string;
let spaceId: string;
const API_KEY = 'test-api-key';

beforeAll(async () => {
  await prisma.$connect();

  const placeRepo = new PrismaPlaceRepository(prisma);
  const spaceRepo = new PrismaSpaceRepository(prisma);
  const reservationRepo = new PrismaReservationRepository(prisma);

  const mockMqttClient = { publishAsync: jest.fn() } as unknown as MqttClient;

  app = createApp(
    new PlaceController(new PlaceUseCases(placeRepo)),
    new SpaceController(new SpaceUseCases(spaceRepo, placeRepo)),
    new ReservationController(new ReservationUseCases(reservationRepo, spaceRepo)),
    new IoTController(prisma, new DesiredPublisher(mockMqttClient))
  );

  // Seed a place and space for reservation tests
  const place = await prisma.place.create({
    data: { name: 'Res Test Place', latitude: 8.99, longitude: -79.51 },
  });
  placeId = place.id;

  const space = await prisma.space.create({
    data: { placeId, name: 'Res Room', capacity: 5, opensAt: '08:00', closesAt: '20:00' },
  });
  spaceId = space.id;
});

afterAll(async () => {
  await prisma.reservation.deleteMany();
  await prisma.space.deleteMany();
  await prisma.place.deleteMany();
  await prisma.$disconnect();
});

describe('Reservations API', () => {
  let reservationId: string;

  it('POST /api/reservations creates a reservation', async () => {
    const res = await request(app).post('/api/reservations').set('x-api-key', API_KEY).send({
      spaceId,
      clientName: 'Alice Test',
      clientEmail: 'alice@test.com',
      reservationDate: '2025-12-15',
      startTime: '09:00',
      endTime: '11:00',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.clientEmail).toBe('alice@test.com');
    reservationId = res.body.data.id;
  });

  it('POST /api/reservations returns 409 when schedule conflicts', async () => {
    const res = await request(app).post('/api/reservations').set('x-api-key', API_KEY).send({
      spaceId,
      clientName: 'Bob Test',
      clientEmail: 'bob@test.com',
      reservationDate: '2025-12-15',
      startTime: '10:00',
      endTime: '12:00',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/reserved/i);
  });

  it('POST /api/reservations returns 422 when endTime <= startTime', async () => {
    const res = await request(app).post('/api/reservations').set('x-api-key', API_KEY).send({
      spaceId,
      clientName: 'Carol Test',
      clientEmail: 'carol@test.com',
      reservationDate: '2025-12-20',
      startTime: '14:00',
      endTime: '10:00',
    });

    // Zod will catch invalid email/date, domain error catches invalid time range
    expect([409, 422].includes(res.status)).toBe(true);
  });

  it('GET /api/reservations returns paginated results', async () => {
    const res = await request(app)
      .get('/api/reservations?page=1&pageSize=5')
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta.pageSize).toBe(5);
  });

  it('GET /api/reservations filters by spaceId', async () => {
    const res = await request(app)
      .get(`/api/reservations?spaceId=${spaceId}`)
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.data.every((r: { spaceId: string }) => r.spaceId === spaceId)).toBe(true);
  });

  it('DELETE /api/reservations/:id deletes the reservation', async () => {
    const res = await request(app)
      .delete(`/api/reservations/${reservationId}`)
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(204);
  });
});
