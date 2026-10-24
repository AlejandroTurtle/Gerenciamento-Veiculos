import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Vehicle,
  VehicleDatabase,
  VehicleInput,
} from '../models/vehicle.model';
import type { VehicleFilters } from '../validators/vehicle.schema';

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

  async updateVehicle(id: string, vehicle: VehicleInput): Promise<Vehicle> {
    const vehiclesData = await this.readDatabase();

    const vehicleIndex = vehiclesData.vehicles.findIndex(
      (savedVehicle) => savedVehicle.id === id
    );

    if (vehicleIndex === -1) {
      throw new VehicleNotFoundError();
    }

    const updatedVehicle: Vehicle = {
      id,
      plate: vehicle.plate,
      color: vehicle.color,
      mark: vehicle.mark,
    };

    vehiclesData.vehicles[vehicleIndex] = updatedVehicle;
    await writeFile(
      databasePath,
      `${JSON.stringify(vehiclesData, null, 2)}\n`,
      'utf8'
    );

    return updatedVehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    const vehiclesData = await this.readDatabase();

    const vehicleIndex = vehiclesData.vehicles.findIndex(
      (savedVehicle) => savedVehicle.id === id
    );

    if (vehicleIndex === -1) {
      throw new VehicleNotFoundError();
    }

    vehiclesData.vehicles.splice(vehicleIndex, 1);
    await writeFile(
      databasePath,
      `${JSON.stringify(vehiclesData, null, 2)}\n`,
      'utf8'
    );
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const vehiclesData = await this.readDatabase();

    const vehicle = vehiclesData.vehicles.find(
      (savedVehicle) => savedVehicle.id === id
    );

    if (!vehicle) {
      throw new VehicleNotFoundError();
    }

    return vehicle;
  }

  async getVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
    const vehiclesData = await this.readDatabase();
    const normalizedPlateFilter = filters.plate
      ?.replaceAll('-', '')
      .toUpperCase();
    const normalizedColorFilter = filters.color?.toLowerCase();
    const normalizedMarkFilter = filters.mark?.toLowerCase();

    return vehiclesData.vehicles.filter((vehicle) => {
      const normalizedPlate = vehicle.plate.replaceAll('-', '').toUpperCase();

      if (
        normalizedPlateFilter &&
        !normalizedPlate.includes(normalizedPlateFilter)
      ) {
        return false;
      }

      if (
        normalizedColorFilter &&
        !vehicle.color.toLowerCase().includes(normalizedColorFilter)
      ) {
        return false;
      }

      if (
        normalizedMarkFilter &&
        !vehicle.mark.toLowerCase().includes(normalizedMarkFilter)
      ) {
        return false;
      }

      return true;
    });
  }
}

export class DuplicateVehiclePlateError extends Error {
  constructor() {
    super('Já existe um veículo com esta placa.');
    this.name = 'DuplicateVehiclePlateError';
  }
}

export class VehicleNotFoundError extends Error {
  constructor() {
    super(
      'Veículo não encontrado. Verifique o ID fornecido e tente novamente.'
    );
    this.name = 'VehicleNotFoundError';
  }
}
