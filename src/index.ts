import express from 'express';
import VehicleController from './controllers/vehicle.controller';
import { createVehicleRouter } from './routes/vehicle.route';
import VehicleService from './services/vehicle.service';

const app = express();
const port = Number(process.env.PORT) || 3000;

const vehicleService = new VehicleService();
const vehicleController = new VehicleController(vehicleService);

app.use(express.json());
app.use(createVehicleRouter(vehicleController));

app.get('/', (_request, response) => {
  response.json({ message: 'API de gerenciamento de veículos' });
});

app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
