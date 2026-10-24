import { Router } from 'express';
import type DriverController from '../controllers/driver.controller';

export function createDriverRouter(controller: DriverController) {
  const router = Router();

  router.post('/motorista/criar', (req, res) =>
    controller.createDriver(req, res)
  );

  router.put('/motorista/editar/:id', (req, res) =>
    controller.updateDriver(req, res)
  );

  router.delete('/motorista/deletar/:id', (req, res) =>
    controller.deleteDriver(req, res)
  );

  router.get('/motorista/buscar/:id', (req, res) =>
    controller.getDriverById(req, res)
  );

  router.get('/motorista', (req, res) => controller.getDrivers(req, res));

  return router;
}
