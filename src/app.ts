import express from 'express';
import DriverController from './controllers/driver.controller';
import VehicleController from './controllers/vehicle.controller';
import VehicleUsageController from './controllers/vehicleUsage.controller';
import { createDriverRouter } from './routes/driver.route';
import { createVehicleRouter } from './routes/vehicle.route';
import { createVehicleUsageRouter } from './routes/vehicleUsage.route';
import DriverService from './services/driver.service';
import VehicleService from './services/vehicle.service';
import VehicleUsageService from './services/vehicleUsage.service';

export function createApp() {
  const app = express();
  const vehicleService = new VehicleService();
  const driverService = new DriverService();
  const usageService = new VehicleUsageService(vehicleService, driverService);

  app.use(express.json());
  app.use(createVehicleRouter(new VehicleController(vehicleService)));
  app.use(createDriverRouter(new DriverController(driverService)));
  app.use(
    createVehicleUsageRouter(new VehicleUsageController(usageService))
  );

  app.get('/', (_request, response) => {
    response.json({ message: 'API de gerenciamento de veículos' });
  });

  return app;
}
