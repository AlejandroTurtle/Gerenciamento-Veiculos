import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { DriverStatusEnum } from '../models/driver.model';
import type {
  Usage,
  UsageDatabase,
  UsageInput,
  UsageListItem,
} from '../models/vehicleUsage.model';
import DriverService from './driver.service';
import VehicleService from './vehicle.service';

const usageDatabasePath = path.resolve(
  process.cwd(),
  'src',
  'database',
  'vehicleUsage.json'
);

export default class VehicleUsageService {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly driverService: DriverService
  ) {}

  private async readDatabase(): Promise<UsageDatabase> {
    const content = await readFile(usageDatabasePath, 'utf8');
    return JSON.parse(content) as UsageDatabase;
  }

  private async writeDatabase(database: UsageDatabase): Promise<void> {
    await writeFile(
      usageDatabasePath,
      `${JSON.stringify(database, null, 2)}\n`,
      'utf8'
    );
  }

  async createUsage(input: UsageInput): Promise<Usage> {
    const [vehicle, driver, database] = await Promise.all([
      this.vehicleService.getVehicleById(input.vehicleId),
      this.driverService.getDriverById(input.driverId),
      this.readDatabase(),
    ]);

    if (vehicle.vehicleInUse) {
      throw new VehicleAlreadyInUseError();
    }

    if (driver.status !== DriverStatusEnum.AVAILABLE) {
      throw new DriverAlreadyInUseError();
    }

    const usage: Usage = {
      ...input,
      id: uuidv4(),
      initialDate: new Date().toISOString(),
      finalDate: null,
    };

    await this.vehicleService.setVehicleInUse(vehicle.id, true);

    try {
      await this.driverService.setDriverStatus(
        driver.id,
        DriverStatusEnum.USING_A_VEHICLE
      );
      database.usages.push(usage);
      await this.writeDatabase(database);
    } catch (error) {
      await Promise.allSettled([
        this.vehicleService.setVehicleInUse(vehicle.id, false),
        this.driverService.setDriverStatus(
          driver.id,
          DriverStatusEnum.AVAILABLE
        ),
      ]);
      throw error;
    }

    return usage;
  }

  async finishUsage(id: string): Promise<Usage> {
    const database = await this.readDatabase();
    const usageIndex = database.usages.findIndex((usage) => usage.id === id);

    if (usageIndex === -1) {
      throw new UsageNotFoundError();
    }

    const usage = database.usages[usageIndex];

    if (usage.finalDate !== null) {
      throw new UsageAlreadyFinishedError();
    }

    const finishedUsage: Usage = {
      ...usage,
      finalDate: new Date().toISOString(),
    };

    await this.vehicleService.setVehicleInUse(usage.vehicleId, false);

    try {
      await this.driverService.setDriverStatus(
        usage.driverId,
        DriverStatusEnum.AVAILABLE
      );
      database.usages[usageIndex] = finishedUsage;
      await this.writeDatabase(database);
    } catch (error) {
      await Promise.allSettled([
        this.vehicleService.setVehicleInUse(usage.vehicleId, true),
        this.driverService.setDriverStatus(
          usage.driverId,
          DriverStatusEnum.USING_A_VEHICLE
        ),
      ]);
      throw error;
    }

    return finishedUsage;
  }

  async getUsages(): Promise<UsageListItem[]> {
    const [database, vehicles, drivers] = await Promise.all([
      this.readDatabase(),
      this.vehicleService.getVehicles(),
      this.driverService.getDrivers(),
    ]);
    const vehiclesById = new Map(
      vehicles.map((vehicle) => [vehicle.id, vehicle] as const)
    );
    const driversById = new Map(
      drivers.map((driver) => [driver.id, driver] as const)
    );

    return database.usages.map((usage) => {
      const vehicle = vehiclesById.get(usage.vehicleId);
      const driver = driversById.get(usage.driverId);

      return {
        ...usage,
        driver: driver ? { id: driver.id, name: driver.name } : null,
        vehicle: vehicle
          ? {
              id: vehicle.id,
              plate: vehicle.plate,
              color: vehicle.color,
              mark: vehicle.mark,
            }
          : null,
      };
    });
  }
}

export class VehicleAlreadyInUseError extends Error {
  constructor() {
    super('Este veículo já está em uso.');
    this.name = 'VehicleAlreadyInUseError';
  }
}

export class DriverAlreadyInUseError extends Error {
  constructor() {
    super('Este motorista já está utilizando um veículo.');
    this.name = 'DriverAlreadyInUseError';
  }
}

export class UsageNotFoundError extends Error {
  constructor() {
    super('Registro de utilização não encontrado.');
    this.name = 'UsageNotFoundError';
  }
}

export class UsageAlreadyFinishedError extends Error {
  constructor() {
    super('Esta utilização já foi finalizada.');
    this.name = 'UsageAlreadyFinishedError';
  }
}
