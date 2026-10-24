import { z } from 'zod';
import type { UsageInput } from '../models/vehicleUsage.model';

const driverErrorMessage = 'Informe o ID do motorista.';
const reasonErrorMessage = 'Informe o motivo do uso do veículo.';
const vehicleErrorMessage = 'Informe o ID do veículo.';

export const usageSchema: z.ZodType<UsageInput> = z.object({
  driverId: z
    .string({ error: driverErrorMessage })
    .trim()
    .min(1, { error: driverErrorMessage }),
  reason: z
    .string({ error: reasonErrorMessage })
    .trim()
    .min(1, { error: reasonErrorMessage }),
  vehicleId: z
    .string({ error: vehicleErrorMessage })
    .trim()
    .min(1, { error: vehicleErrorMessage }),
});
