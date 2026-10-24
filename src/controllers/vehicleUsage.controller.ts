import type { Request, Response } from 'express';
import { DriverNotFoundError } from '../services/driver.service';
import VehicleUsageService, {
  DriverAlreadyInUseError,
  UsageAlreadyFinishedError,
  UsageNotFoundError,
  VehicleAlreadyInUseError,
} from '../services/vehicleUsage.service';
import { VehicleNotFoundError } from '../services/vehicle.service';
import { usageSchema } from '../validators/vehicleUsage.schema';

export default class VehicleUsageController {
  constructor(private readonly service: VehicleUsageService) {}

  async createReservation(req: Request, res: Response) {
    try {
      const validation = usageSchema.safeParse(req.body ?? {});

      if (!validation.success) {
        return res.status(400).json({
          error: validation.error.issues[0].message,
        });
      }

      const usage = await this.service.createUsage(validation.data);
      return res.status(201).json(usage);
    } catch (error) {
      if (
        error instanceof VehicleNotFoundError ||
        error instanceof DriverNotFoundError
      ) {
        return res.status(404).json({ error: error.message });
      }

      if (
        error instanceof VehicleAlreadyInUseError ||
        error instanceof DriverAlreadyInUseError
      ) {
        return res.status(409).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível iniciar a utilização do veículo.' });
    }
  }

  async finishUsage(req: Request<{ id: string }>, res: Response) {
    try {
      console.log('id recebido', req.params.id);
      const usage = await this.service.finishUsage(req.params.id);
      return res.status(200).json(usage);
    } catch (error) {
      if (error instanceof UsageNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      if (
        error instanceof UsageAlreadyFinishedError ||
        error instanceof VehicleNotFoundError ||
        error instanceof DriverNotFoundError
      ) {
        return res.status(409).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível finalizar a utilização do veículo.' });
    }
  }

  async getUsages(req: Request, res: Response) {
    try {
      const usages = await this.service.getUsages();
      return res.status(200).json(usages);
    } catch {
      return res.status(500).json({
        error: 'Não foi possível listar as utilizações dos veículos.',
      });
    }
  }
}
