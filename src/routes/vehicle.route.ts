import { Router } from 'express';
import type VehicleController from '../controllers/vehicle.controller';

export function createVehicleRouter(controller: VehicleController) {
  const router = Router();
  router.post('/veiculo/criar', (req, res) =>
    controller.createVehicle(req, res)
  );

  router.put('/veiculo/editar/:id', (req, res) => {
    controller.updateVehicle(req, res);
  });

  router.delete('/veiculo/deletar/:id', (req, res) => {
    controller.deleleVehicle(req, res);
  });

  router.get('/veiculo/buscar/:id', (req, res) => {
    controller.getVehicleById(req, res);
  });

  router.get('/veiculo', (req, res) => {
    controller.getVehicles(req, res);
  });

  return router;
}
