import { Router } from 'express';
import VehicleUsageController from '../controllers/vehicleUsage.controller';

export function createVehicleUsageRouter(controller: VehicleUsageController) {
  const router = Router();
  router.post('/reserva/veiculo/criar', (req, res) =>
    controller.createReservation(req, res)
  );
  router.put('/reserva/veiculo/finalizar/:id', (req, res) =>
    controller.finishUsage(req, res)
  );
  router.get('/reserva/veiculo', (req, res) => controller.getUsages(req, res));

  return router;
}
