import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Vehicle,
  VehicleDatabase,
  VehicleInput,
} from '../models/vehicle.model';

const databasePath = path.resolve(
  process.cwd(),
  'src',
  'database',
  'vehicles.json'
);

export default class VehicleService {
  private async readDatabase(): Promise<VehicleDatabase> {
    const content = await readFile(databasePath, 'utf8');
    return JSON.parse(content) as VehicleDatabase;
  }

  async createVehicle(vehicle: VehicleInput): Promise<Vehicle> {
    const vehiclesData = await this.readDatabase();

    if (
      vehiclesData.vehicles.some(
        (savedVehicle) => savedVehicle.plate === vehicle.plate
      )
    ) {
      throw new DuplicateVehiclePlateError();
    }

    const newVehicle: Vehicle = {
      id: uuidv4(),
      plate: vehicle.plate,
      color: vehicle.color,
      mark: vehicle.mark,
    };

    vehiclesData.vehicles.push(newVehicle);
    await writeFile(
      databasePath,
      `${JSON.stringify(vehiclesData, null, 2)}\n`,
      'utf8'
    );

    return newVehicle;
  }
}

export class DuplicateVehiclePlateError extends Error {
  constructor() {
    super('Já existe um veículo com esta placa.');
    this.name = 'DuplicateVehiclePlateError';
  }
}
