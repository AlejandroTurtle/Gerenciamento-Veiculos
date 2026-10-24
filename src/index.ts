import express from 'express';
import DriverController from './controllers/driver.controller';
import VehicleController from './controllers/vehicle.controller';
import { createDriverRouter } from './routes/driver.route';
import { createVehicleRouter } from './routes/vehicle.route';
import DriverService from './services/driver.service';
import VehicleService from './services/vehicle.service';

const app = express();
const port = Number(process.env.PORT) || 3000;

const vehicleService = new VehicleService();
const vehicleController = new VehicleController(vehicleService);
const driverService = new DriverService();
const driverController = new DriverController(driverService);

app.use(express.json());
app.use(createVehicleRouter(vehicleController));
app.use(createDriverRouter(driverController));

app.get('/', (_request, response) => {
  response.json({ message: 'API de gerenciamento de veículos' });
});

app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
