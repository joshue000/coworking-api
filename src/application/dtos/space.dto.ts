import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const CreateSpaceSchema = z.object({
  placeId: z.string().cuid(),
  name: z.string().min(1).max(255),
  reference: z.string().max(255).optional(),
  capacity: z.number().int().positive(),
  description: z.string().optional(),
  opensAt: z.string().regex(timeRegex, 'Must be in HH:mm format'),
  closesAt: z.string().regex(timeRegex, 'Must be in HH:mm format'),
});

export const UpdateSpaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  reference: z.string().max(255).optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().optional(),
  opensAt: z.string().regex(timeRegex, 'Must be in HH:mm format').optional(),
  closesAt: z.string().regex(timeRegex, 'Must be in HH:mm format').optional(),
});

export type CreateSpaceDto = z.infer<typeof CreateSpaceSchema>;
export type UpdateSpaceDto = z.infer<typeof UpdateSpaceSchema>;
