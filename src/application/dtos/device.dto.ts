import { z } from "zod";

export const UpdateDeviceDesiredSchema = z.object({
  samplingIntervalSec: z.number().int().min(1).max(3600).optional(),
  co2AlertThreshold: z.number().int().min(100).max(5000).optional(),
});

export type UpdateDeviceDesiredDto = z.infer<typeof UpdateDeviceDesiredSchema>;
