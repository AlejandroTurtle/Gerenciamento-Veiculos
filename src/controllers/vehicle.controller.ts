import type { Request, Response } from 'express';
import {
  DuplicateVehiclePlateError,
  VehicleInUseError,
  VehicleNotFoundError,
} from '../services/vehicle.service';
import VehicleService from '../services/vehicle.service';
import {
  vehicleFiltersSchema,
  vehicleSchema,
} from '../validators/vehicle.schema';

export default class VehicleController {
  constructor(private readonly service: VehicleService) {}

  async createVehicle(req: Request, res: Response) {
    try {
      const validation = vehicleSchema.safeParse(req.body ?? {});

      if (!validation.success) {
        return res.status(400).json({
          error: validation.error.issues[0].message,
        });
      }

      const newVehicle = await this.service.createVehicle(validation.data);
      return res.status(201).json(newVehicle);
    } catch (error: any) {
      if (error instanceof DuplicateVehiclePlateError) {
        return res.status(409).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível criar o veículo.' });
    }
  }

  async updateVehicle(req: Request<{ id: string }>, res: Response) {
    try {
      const id = req.params.id;

      const validation = vehicleSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: validation.error.issues[0].message,
        });
      }

      const updatedVehicle = await this.service.updateVehicle(
        id,
        validation.data
      );

      return res.status(200).json(updatedVehicle);
    } catch (error: any) {
      if (error instanceof VehicleNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível atualizar o veículo.' });
    }
  }

  async deleleVehicle(req: Request<{ id: string }>, res: Response) {
    try {
      const id = req.params.id;
      await this.service.deleteVehicle(id);
      return res.status(200).json({ message: 'Veículo deletado com sucesso.' });
    } catch (error: any) {
      if (error instanceof VehicleNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      if (error instanceof VehicleInUseError) {
        return res.status(409).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível deletar o veículo.' });
    }
  }

  async getVehicleById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = req.params.id;
      const vehicle = await this.service.getVehicleById(id);
      return res.status(200).json(vehicle);
    } catch (error: any) {
      if (error instanceof VehicleNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível buscar o veículo.' });
    }
  }

  async getVehicles(req: Request, res: Response) {
    try {
      const validation = vehicleFiltersSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: validation.error.issues[0].message,
        });
      }

      const vehicles = await this.service.getVehicles(validation.data);
      return res.status(200).json(vehicles);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: 'Não foi possível buscar os veículos.' });
    }
  }
}
