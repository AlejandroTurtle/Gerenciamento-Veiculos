import type { Request, Response } from 'express';
import { DuplicateVehiclePlateError } from '../services/vehicle.service';
import VehicleService from '../services/vehicle.service';

export default class VehicleController {
  constructor(private readonly service: VehicleService) {}

  async createVehicle(req: Request, res: Response) {
    try {
      const { plate, color, mark } = req.body;

      switch (true) {
        case !plate:
          return res.status(400).json({ error: 'Informe a placa do veículo.' });
        case !color:
          return res.status(400).json({ error: 'Informe a cor do veículo.' });
        case !mark:
          return res.status(400).json({ error: 'Informe a marca do veículo.' });
      }

      const normalizedPlate = plate.toUpperCase();

      const input = { plate: normalizedPlate, color, mark };

      const newVehicle = await this.service.createVehicle(input);
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
}
