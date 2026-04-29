import { z } from 'zod';

export const CreatePlaceSchema = z.object({
  name: z.string().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().optional().default('America/Panama'),
});

export const UpdatePlaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().optional(),
});

export type CreatePlaceDto = z.infer<typeof CreatePlaceSchema>;
export type UpdatePlaceDto = z.infer<typeof UpdatePlaceSchema>;
