import { Router } from 'express';
import type VehicleController from '../controllers/vehicle.controller';

export function createVehicleRouter(controller: VehicleController) {
  const router = Router();
  router.post('/criar/veiculo', (req, res) =>
    controller.createVehicle(req, res)
  );

  return router;
}
