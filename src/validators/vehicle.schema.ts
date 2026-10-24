import { z } from 'zod';
import type { VehicleInput } from '../models/vehicle.model';

const plateErrorMessage = 'Informe a placa do veículo.';
const invalidPlateErrorMessage =
  'Placa inválida. Use ABC-1234 (antiga, com ou sem hífen) ou ABC1D23 (Mercosul).';
const colorErrorMessage = 'Informe a cor do veículo.';
const markErrorMessage = 'Informe a marca do veículo.';
const platePattern = /^(?:[A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/;

export const vehicleSchema: z.ZodType<VehicleInput> = z.object({
  plate: z
    .string({ error: plateErrorMessage })
    .trim()
    .toUpperCase()
    .min(1, { error: plateErrorMessage })
    .regex(platePattern, { error: invalidPlateErrorMessage }),
  color: z
    .string({ error: colorErrorMessage })
    .trim()
    .min(1, { error: colorErrorMessage }),
  mark: z
    .string({ error: markErrorMessage })
    .trim()
    .min(1, { error: markErrorMessage }),
});

export const vehicleFiltersSchema = z.object({
  plate: z.string().trim().toUpperCase().optional(),
  color: z.string().trim().optional(),
  mark: z.string().trim().optional(),
});

export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>;
