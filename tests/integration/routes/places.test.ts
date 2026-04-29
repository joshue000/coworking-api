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
const API_KEY = 'test-api-key';

beforeAll(async () => {
  await prisma.$connect();

  const placeRepo = new PrismaPlaceRepository(prisma);
  const spaceRepo = new PrismaSpaceRepository(prisma);
  const reservationRepo = new PrismaReservationRepository(prisma);

  const placeUseCases = new PlaceUseCases(placeRepo);
  const spaceUseCases = new SpaceUseCases(spaceRepo, placeRepo);
  const reservationUseCases = new ReservationUseCases(reservationRepo, spaceRepo);

  const mockMqttClient = { publishAsync: jest.fn() } as unknown as MqttClient;
  const desiredPublisher = new DesiredPublisher(mockMqttClient);

  app = createApp(
    new PlaceController(placeUseCases),
    new SpaceController(spaceUseCases),
    new ReservationController(reservationUseCases),
    new IoTController(prisma, desiredPublisher)
  );
});

afterAll(async () => {
  await prisma.reservation.deleteMany();
  await prisma.space.deleteMany();
  await prisma.place.deleteMany();
  await prisma.$disconnect();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Places API', () => {
  let createdPlaceId: string;

  it('GET /api/places returns 401 without API key', async () => {
    const res = await request(app).get('/api/places');
    expect(res.status).toBe(401);
  });

  it('POST /api/places creates a place', async () => {
    const res = await request(app)
      .post('/api/places')
      .set('x-api-key', API_KEY)
      .send({ name: 'Test HQ', latitude: 8.99, longitude: -79.51, timezone: 'America/Panama' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test HQ');
    createdPlaceId = res.body.data.id;
  });

  it('GET /api/places returns paginated list', async () => {
    const res = await request(app).get('/api/places?page=1&pageSize=10').set('x-api-key', API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /api/places/:id returns the created place', async () => {
    const res = await request(app).get(`/api/places/${createdPlaceId}`).set('x-api-key', API_KEY);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdPlaceId);
  });

  it('PATCH /api/places/:id updates the place name', async () => {
    const res = await request(app)
      .patch(`/api/places/${createdPlaceId}`)
      .set('x-api-key', API_KEY)
      .send({ name: 'Updated HQ' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated HQ');
  });

  it('GET /api/places/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/places/non-existent-id').set('x-api-key', API_KEY);

    expect(res.status).toBe(404);
  });

  it('POST /api/places returns 422 for invalid payload', async () => {
    const res = await request(app)
      .post('/api/places')
      .set('x-api-key', API_KEY)
      .send({ name: 'No Coords' });

    expect(res.status).toBe(422);
  });

  it('DELETE /api/places/:id deletes the place', async () => {
    const res = await request(app)
      .delete(`/api/places/${createdPlaceId}`)
      .set('x-api-key', API_KEY);

    expect(res.status).toBe(204);
  });
});
