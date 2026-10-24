import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Driver,
  DriverDatabase,
  DriverInput,
} from '../models/driver.model';
import type { DriverFilters } from '../validators/driver.schema';

const databasePath = path.resolve(
  process.cwd(),
  'src',
  'database',
  'drivers.json'
);

export default class DriverService {
  private async readDatabase(): Promise<DriverDatabase> {
    const content = await readFile(databasePath, 'utf8');
    return JSON.parse(content) as DriverDatabase;
  }

  private async writeDatabase(database: DriverDatabase): Promise<void> {
    await writeFile(
      databasePath,
      `${JSON.stringify(database, null, 2)}\n`,
      'utf8'
    );
  }

  async createDriver(driver: DriverInput): Promise<Driver> {
    const database = await this.readDatabase();

    const newDriver: Driver = {
      id: uuidv4(),
      name: driver.name,
    };

    database.drivers.push(newDriver);
    await this.writeDatabase(database);

    return newDriver;
  }

  async updateDriver(id: string, driver: DriverInput): Promise<Driver> {
    const database = await this.readDatabase();

    const driverIndex = database.drivers.findIndex(
      (savedDriver) => savedDriver.id === id
    );

    if (driverIndex === -1) {
      throw new DriverNotFoundError();
    }

    const updatedDriver: Driver = { id, name: driver.name };
    database.drivers[driverIndex] = updatedDriver;
    await this.writeDatabase(database);

    return updatedDriver;
  }

  async deleteDriver(id: string): Promise<void> {
    const database = await this.readDatabase();

    const driverIndex = database.drivers.findIndex(
      (savedDriver) => savedDriver.id === id
    );

    if (driverIndex === -1) {
      throw new DriverNotFoundError();
    }

    database.drivers.splice(driverIndex, 1);
    await this.writeDatabase(database);
  }

  async getDriverById(id: string): Promise<Driver> {
    const database = await this.readDatabase();

    const driver = database.drivers.find(
      (savedDriver) => savedDriver.id === id
    );

    if (!driver) {
      throw new DriverNotFoundError();
    }

    return driver;
  }

  async getDrivers(filters: DriverFilters = {}): Promise<Driver[]> {
    const database = await this.readDatabase();

    const nameFilter = filters.name?.toLowerCase();

    if (!nameFilter) {
      return database.drivers;
    }

    return database.drivers.filter((driver) =>
      driver.name.toLowerCase().includes(nameFilter)
    );
  }
}

export class DriverNotFoundError extends Error {
  constructor() {
    super(
      'Motorista não encontrado. Verifique o ID fornecido e tente novamente.'
    );
    this.name = 'DriverNotFoundError';
  }
}
