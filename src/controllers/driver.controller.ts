import type { Request, Response } from 'express';
import {
  DriverInUseError,
  DriverNotFoundError,
} from '../services/driver.service';
import DriverService from '../services/driver.service';
import {
  driverFiltersSchema,
  driverSchema,
} from '../validators/driver.schema';

export default class DriverController {
  constructor(private readonly service: DriverService) {}

  async createDriver(req: Request, res: Response) {
    const validation = driverSchema.safeParse(req.body ?? {});

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues[0].message,
      });
    }

    try {
      const driver = await this.service.createDriver(validation.data);
      return res.status(201).json(driver);
    } catch {
      return res
        .status(500)
        .json({ error: 'Não foi possível cadastrar o motorista.' });
    }
  }

  async updateDriver(req: Request<{ id: string }>, res: Response) {
    const validation = driverSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues[0].message,
      });
    }

    try {
      const driver = await this.service.updateDriver(
        req.params.id,
        validation.data
      );
      return res.status(200).json(driver);
    } catch (error) {
      if (error instanceof DriverNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível atualizar o motorista.' });
    }
  }

  async deleteDriver(req: Request<{ id: string }>, res: Response) {
    try {
      await this.service.deleteDriver(req.params.id);
      return res.status(200).json({ message: 'Motorista excluído com sucesso.' });
    } catch (error) {
      if (error instanceof DriverNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      if (error instanceof DriverInUseError) {
        return res.status(409).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível excluir o motorista.' });
    }
  }

  async getDriverById(req: Request<{ id: string }>, res: Response) {
    try {
      const driver = await this.service.getDriverById(req.params.id);
      return res.status(200).json(driver);
    } catch (error) {
      if (error instanceof DriverNotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      return res
        .status(500)
        .json({ error: 'Não foi possível buscar o motorista.' });
    }
  }

  async getDrivers(req: Request, res: Response) {
    const validation = driverFiltersSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.issues[0].message,
      });
    }

    try {
      const drivers = await this.service.getDrivers(validation.data);
      return res.status(200).json(drivers);
    } catch {
      return res
        .status(500)
        .json({ error: 'Não foi possível listar os motoristas.' });
    }
  }
}
