import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

function toHHmm(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function roundUpTo15(date: Date): Date {
  const ms = 15 * 60_000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

// Returns a start time that is at least 15 min from now, rounded up to next
// 15-min boundary, and respects the space's opening hours.
function buildSlot(
  opensAt: string,
  closesAt: string,
  durationMin: number
): { startTime: string; endTime: string } | null {
  const now = new Date();
  const earliest = roundUpTo15(addMinutes(now, 15));

  const [openH, openM] = opensAt.split(':').map(Number);
  const [closeH, closeM] = closesAt.split(':').map(Number);

  const open = new Date(now);
  open.setHours(openH, openM, 0, 0);

  const close = new Date(now);
  close.setHours(closeH, closeM, 0, 0);

  const start = earliest < open ? open : earliest;
  const end = addMinutes(start, durationMin);

  if (end > close) return null; // not enough time left today
  return { startTime: toHHmm(start), endTime: toHHmm(end) };
}

const places = [
  // ── Panama ────────────────────────────────────────────────────────────────
  {
    name: 'Downtown Hub — Ciudad de Panamá',
    latitude: 8.9936,
    longitude: -79.5197,
    timezone: 'America/Panama',
    spaces: [
      { name: 'The Boardroom', reference: 'DR-01', capacity: 12, opensAt: '07:00', closesAt: '20:00', description: 'Large conference room with projector and whiteboard' },
      { name: 'Focus Pod A', reference: 'FP-A', capacity: 2, opensAt: '07:00', closesAt: '20:00', description: 'Quiet private pod for deep work' },
      { name: 'Focus Pod B', reference: 'FP-B', capacity: 2, opensAt: '07:00', closesAt: '20:00', description: 'Quiet private pod for deep work' },
      { name: 'Open Lounge', reference: 'OL-01', capacity: 20, opensAt: '07:00', closesAt: '22:00', description: 'Casual open area with standing desks and sofas' },
    ],
  },
  {
    name: 'Casco Viejo Creative Space — Ciudad de Panamá',
    latitude: 8.9527,
    longitude: -79.5354,
    timezone: 'America/Panama',
    spaces: [
      { name: 'The Studio', reference: 'ST-01', capacity: 10, opensAt: '09:00', closesAt: '20:00', description: 'Artistic space with natural light and exposed brick' },
      { name: 'Rooftop Terrace', reference: 'RT-01', capacity: 18, opensAt: '10:00', closesAt: '19:00', description: 'Open-air meeting space with panoramic views' },
      { name: 'Workshop Room', reference: 'WR-01', capacity: 20, opensAt: '09:00', closesAt: '18:00', description: 'Hands-on workshop space with tools and materials' },
    ],
  },
  // ── Ecuador ───────────────────────────────────────────────────────────────
  {
    name: 'Cowork Quito Norte — Quito',
    latitude: -0.1807,
    longitude: -78.4678,
    timezone: 'America/Guayaquil',
    spaces: [
      { name: 'Sala Cóndor', reference: 'SC-01', capacity: 10, opensAt: '08:00', closesAt: '19:00', description: 'Sala de reuniones con vista a la ciudad' },
      { name: 'Zona Abierta', reference: 'ZA-01', capacity: 30, opensAt: '07:00', closesAt: '21:00', description: 'Espacio abierto con escritorios flexibles' },
      { name: 'Cabina Privada 1', reference: 'CP-01', capacity: 1, opensAt: '07:00', closesAt: '21:00', description: 'Cabina insonorizada para llamadas y videollamadas' },
      { name: 'Cabina Privada 2', reference: 'CP-02', capacity: 1, opensAt: '07:00', closesAt: '21:00', description: 'Cabina insonorizada para llamadas y videollamadas' },
    ],
  },
  {
    name: 'Hub Guayaquil — Guayaquil',
    latitude: -2.1962,
    longitude: -79.8862,
    timezone: 'America/Guayaquil',
    spaces: [
      { name: 'Sala Galápagos', reference: 'SG-01', capacity: 14, opensAt: '08:00', closesAt: '20:00', description: 'Sala de conferencias con equipo audiovisual completo' },
      { name: 'Espacio Colibrí', reference: 'EC-01', capacity: 6, opensAt: '08:00', closesAt: '20:00', description: 'Sala pequeña ideal para equipos ágiles' },
      { name: 'Terraza Malecón', reference: 'TM-01', capacity: 20, opensAt: '09:00', closesAt: '18:00', description: 'Espacio al aire libre con vista al río Guayas' },
    ],
  },
  // ── Colombia ──────────────────────────────────────────────────────────────
  {
    name: 'El Poblado Cowork — Medellín',
    latitude: 6.2086,
    longitude: -75.5659,
    timezone: 'America/Bogota',
    spaces: [
      { name: 'Sala Orquídea', reference: 'SO-01', capacity: 8, opensAt: '07:00', closesAt: '20:00', description: 'Sala de reuniones con pizarra interactiva' },
      { name: 'Innovation Floor', reference: 'IF-01', capacity: 40, opensAt: '06:00', closesAt: '22:00', description: 'Gran planta abierta con zonas de colaboración' },
      { name: 'Sala Café', reference: 'SC-02', capacity: 4, opensAt: '07:00', closesAt: '20:00', description: 'Sala informal con ambiente de cafetería' },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  for (const { spaces, ...placeData } of places) {
    const existing = await prisma.place.findFirst({ where: { name: placeData.name } });
    const place = await prisma.place.upsert({
      where: { id: existing?.id ?? '' },
      update: placeData,
      create: placeData,
    });

    console.log(`  Place: ${place.name}`);

    for (const spaceData of spaces) {
      const existingSpace = await prisma.space.findFirst({ where: { name: spaceData.name, placeId: place.id } });
      const space = await prisma.space.upsert({
        where: { id: existingSpace?.id ?? '' },
        update: spaceData,
        create: { ...spaceData, placeId: place.id },
      });
      console.log(`    Space: ${space.name}`);
    }
  }

  // ── Reservations ──────────────────────────────────────────────────────────────
  console.log('\n  Seeding reservations...');

  const today = new Date().toISOString().split('T')[0];

  // Each entry: spaceId, placeId, duration in minutes, client info
  const reservationSeeds = [
    // ─ Downtown Hub ─ El Poblado Cowork (Medellín)
    { spaceId: 'cmoissxjw0012u9uvhxi49czj', placeId: 'cmoissxjl000wu9uvf3tii1jt', opensAt: '07:00', closesAt: '20:00', duration: 60,  clientName: 'Carlos Mendoza',   clientEmail: 'carlos.mendoza@example.com' },
    { spaceId: 'cmoissxjt0010u9uvqvbfdxsk', placeId: 'cmoissxjl000wu9uvf3tii1jt', opensAt: '06:00', closesAt: '22:00', duration: 120, clientName: 'Ana Torres',       clientEmail: 'ana.torres@example.com' },
    { spaceId: 'cmoissxjp000yu9uv97n3oszl', placeId: 'cmoissxjl000wu9uvf3tii1jt', opensAt: '07:00', closesAt: '20:00', duration: 90,  clientName: 'Luis Herrera',     clientEmail: 'luis.herrera@example.com' },
    // ─ Hub Guayaquil
    { spaceId: 'cmoissxjb000ru9uv56h9bczx', placeId: 'cmoissxj8000pu9uvmadohl45', opensAt: '08:00', closesAt: '20:00', duration: 60,  clientName: 'Valeria Rios',     clientEmail: 'valeria.rios@example.com' },
    { spaceId: 'cmoissxjf000tu9uv4ftu5ki3', placeId: 'cmoissxj8000pu9uvmadohl45', opensAt: '08:00', closesAt: '20:00', duration: 45,  clientName: 'Diego Paredes',    clientEmail: 'diego.paredes@example.com' },
    // ─ Cowork Quito Norte
    { spaceId: 'cmoissxiw000iu9uvkk86ezjb', placeId: 'cmoissxiq000gu9uvobkqpilf', opensAt: '08:00', closesAt: '19:00', duration: 90,  clientName: 'Sofía Vega',       clientEmail: 'sofia.vega@example.com' },
    { spaceId: 'cmoissxiz000ku9uve4akuowm', placeId: 'cmoissxiq000gu9uvobkqpilf', opensAt: '07:00', closesAt: '21:00', duration: 120, clientName: 'Mateo Castillo',   clientEmail: 'mateo.castillo@example.com' },
    { spaceId: 'cmoissxj2000mu9uvcl3yzq30', placeId: 'cmoissxiq000gu9uvobkqpilf', opensAt: '07:00', closesAt: '21:00', duration: 30,  clientName: 'Isabella Mora',    clientEmail: 'isabella.mora@example.com' },
    // ─ Casco Viejo Creative Space
    { spaceId: 'cmoissxie000bu9uvrtwg7g8j', placeId: 'cmoissxi70009u9uv6hw0xg7l', opensAt: '09:00', closesAt: '20:00', duration: 60,  clientName: 'Andrés Fuentes',   clientEmail: 'andres.fuentes@example.com' },
    { spaceId: 'cmoissxim000fu9uvam06lbao', placeId: 'cmoissxi70009u9uv6hw0xg7l', opensAt: '09:00', closesAt: '18:00', duration: 90,  clientName: 'Camila Reyes',     clientEmail: 'camila.reyes@example.com' },
    // ─ Downtown Hub ─ Ciudad de Panamá
    { spaceId: 'cmoissxhj0002u9uvqqsowsgu', placeId: 'cmoissxha0000u9uvsmk6po5z', opensAt: '07:00', closesAt: '20:00', duration: 60,  clientName: 'Roberto Núñez',    clientEmail: 'roberto.nunez@example.com' },
    { spaceId: 'cmoissxhp0004u9uvkej202x4', placeId: 'cmoissxha0000u9uvsmk6po5z', opensAt: '07:00', closesAt: '20:00', duration: 45,  clientName: 'Gabriela Soto',    clientEmail: 'gabriela.soto@example.com' },
    { spaceId: 'cmoissxi20008u9uvvomfavqu', placeId: 'cmoissxha0000u9uvsmk6po5z', opensAt: '07:00', closesAt: '22:00', duration: 120, clientName: 'Fernando Lara',    clientEmail: 'fernando.lara@example.com' },
  ];

  let created = 0;
  let skipped = 0;

  for (const seed of reservationSeeds) {
    const slot = buildSlot(seed.opensAt, seed.closesAt, seed.duration);

    if (!slot) {
      console.log(`    Skipped ${seed.clientName} — no time left today for space`);
      skipped++;
      continue;
    }

    // Skip if this client already has a reservation for this space today
    const existing = await prisma.reservation.findFirst({
      where: { spaceId: seed.spaceId, clientEmail: seed.clientEmail, reservationDate: new Date(today) },
    });
    if (existing) {
      console.log(`    Skipped ${seed.clientName} — already has a reservation today`);
      skipped++;
      continue;
    }

    await prisma.reservation.create({
      data: {
        spaceId: seed.spaceId,
        placeId: seed.placeId,
        clientName: seed.clientName,
        clientEmail: seed.clientEmail,
        reservationDate: new Date(today),
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    });
    console.log(`    ✓ ${seed.clientName} — ${slot.startTime}–${slot.endTime}`);
    created++;
  }

  console.log(`  Done: ${created} created, ${skipped} skipped.`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
