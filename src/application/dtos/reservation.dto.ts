import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const CreateReservationSchema = z.object({
  spaceId: z.string().cuid(),
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  reservationDate: z.string().regex(dateRegex, 'Must be in YYYY-MM-DD format'),
  startTime: z.string().regex(timeRegex, 'Must be in HH:mm format'),
  endTime: z.string().regex(timeRegex, 'Must be in HH:mm format'),
});

export const UpdateReservationSchema = z.object({
  clientName: z.string().min(2).optional(),
  reservationDate: z.string().regex(dateRegex, 'Must be in YYYY-MM-DD format').optional(),
  startTime: z.string().regex(timeRegex, 'Must be in HH:mm format').optional(),
  endTime: z.string().regex(timeRegex, 'Must be in HH:mm format').optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const ReservationFiltersSchema = z.object({
  spaceId: z.string().optional(),
  placeId: z.string().optional(),
  clientEmail: z.string().optional(),
  date: z.string().regex(dateRegex).optional(),
});

export type CreateReservationDto = z.infer<typeof CreateReservationSchema>;
export type UpdateReservationDto = z.infer<typeof UpdateReservationSchema>;
