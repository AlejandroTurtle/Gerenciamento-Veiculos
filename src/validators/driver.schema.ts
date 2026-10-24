import { z } from 'zod';
import type { DriverInput } from '../models/driver.model';

const nameErrorMessage = 'Informe o nome do motorista.';

export const driverSchema: z.ZodType<DriverInput> = z.object({
  name: z
    .string({ error: nameErrorMessage })
    .trim()
    .min(1, { error: nameErrorMessage }),
});

export const driverFiltersSchema = z.object({
  name: z.string().trim().optional(),
});

export type DriverFilters = z.infer<typeof driverFiltersSchema>;
