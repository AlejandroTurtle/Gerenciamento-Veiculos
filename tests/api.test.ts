import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import type { Express } from 'express';
import type { Driver as DriverResponse } from '../src/models/driver.model.ts';
import type {
  Usage as UsageResponse,
  UsageListItem as UsageListItemResponse,
} from '../src/models/vehicleUsage.model.ts';
import type { Vehicle as VehicleResponse } from '../src/models/vehicle.model.ts';

const vehiclesFixture = {
  vehicles: [
    {
      id: 'vehicle-1',
      plate: 'ABC-1234',
      color: 'azul',
      mark: 'Fiat',
      vehicleInUse: false,
    },
    {
      id: 'vehicle-2',
      plate: 'XYZ-9999',
      color: 'preto',
      mark: 'Ford',
      vehicleInUse: false,
    },
  ],
};

const driversFixture = {
  drivers: [
    { id: 'driver-1', name: 'Ana Silva', status: 'available' },
    { id: 'driver-2', name: 'João Souza', status: 'available' },
  ],
};

const usagesFixture = { usages: [] };
let baseUrl = '';

describe('API de gerenciamento de veículos', { concurrency: false }, () => {
  let originalWorkingDirectory: string;
  let testDirectory: string;
  let application: Express;
  let server: Server | undefined;

  before(async () => {
    originalWorkingDirectory = process.cwd();
    testDirectory = await mkdtemp(path.join(os.tmpdir(), 'vehicles-api-test-'));
    await mkdir(path.join(testDirectory, 'src', 'database'), {
      recursive: true,
    });
    process.chdir(testDirectory);

    const { createApp } = await import('../src/app.ts');
    application = createApp();
  });

  beforeEach(async () => {
    await writeDatabase('vehicles.json', vehiclesFixture);
    await writeDatabase('drivers.json', driversFixture);
    await writeDatabase('vehicleUsage.json', usagesFixture);

    server = createServer(application);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  });

  after(async () => {
    process.chdir(originalWorkingDirectory);
    await rm(testDirectory, { recursive: true, force: true });
  });

  it('responde na rota raiz da API', async () => {
    const result = await requestJson<{ message: string }>('/');

    assert.equal(result.response.status, 200);
    assert.deepEqual(result.body, {
      message: 'API de gerenciamento de veículos',
    });
  });

  it('inicia, lista e finaliza uma utilização atualizando veículo e motorista', async () => {
    const creation = await requestJson<UsageResponse>(
      '/reserva/veiculo/criar',
      {
        method: 'POST',
        body: {
          vehicleId: 'vehicle-1',
          driverId: 'driver-1',
          reason: 'Entrega de materiais',
        },
      }
    );

    assert.equal(creation.response.status, 201);
    assert.ok(creation.body.id);
    assert.equal(creation.body.finalDate, null);
    assert.ok(Number.isFinite(Date.parse(creation.body.initialDate)));

    const list = await requestJson<UsageListItemResponse[]>(
      '/reserva/veiculo'
    );
    assert.equal(list.response.status, 200);
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].driver?.name, 'Ana Silva');
    assert.equal(list.body[0].vehicle?.plate, 'ABC-1234');

    const vehicleDuringUse = await requestJson<VehicleResponse>(
      '/veiculo/buscar/vehicle-1'
    );
    const driverDuringUse = await requestJson<DriverResponse>(
      '/motorista/buscar/driver-1'
    );
    assert.equal(vehicleDuringUse.body.vehicleInUse, true);
    assert.equal(driverDuringUse.body.status, 'usingAVehicle');

    const finished = await requestJson<UsageResponse>(
      `/reserva/veiculo/finalizar/${creation.body.id}`,
      { method: 'PUT' }
    );
    assert.equal(finished.response.status, 200);
    assert.ok(finished.body.finalDate);
    assert.ok(Number.isFinite(Date.parse(finished.body.finalDate!)));

    const availableVehicle = await requestJson<VehicleResponse>(
      '/veiculo/buscar/vehicle-1'
    );
    const availableDriver = await requestJson<DriverResponse>(
      '/motorista/buscar/driver-1'
    );
    assert.equal(availableVehicle.body.vehicleInUse, false);
    assert.equal(availableDriver.body.status, 'available');

    const repeatedFinish = await requestJson<{ error: string }>(
      `/reserva/veiculo/finalizar/${creation.body.id}`,
      { method: 'PUT' }
    );
    assert.equal(repeatedFinish.response.status, 409);
  });

  it('cobre criação, busca, edição e exclusão de veículos', async () => {
    const creation = await requestJson<VehicleResponse>('/veiculo/criar', {
      method: 'POST',
      body: { plate: 'def-4567', color: 'verde', mark: 'Honda' },
    });
    assert.equal(creation.response.status, 201);
    assert.equal(creation.body.plate, 'DEF-4567');
    assert.equal(creation.body.vehicleInUse, false);

    const duplicate = await requestJson<{ error: string }>('/veiculo/criar', {
      method: 'POST',
      body: { plate: 'DEF-4567', color: 'verde', mark: 'Honda' },
    });
    assert.equal(duplicate.response.status, 409);

    const search = await requestJson<VehicleResponse>(
      `/veiculo/buscar/${creation.body.id}`
    );
    assert.equal(search.response.status, 200);
    assert.equal(search.body.mark, 'Honda');

    const update = await requestJson<VehicleResponse>(
      `/veiculo/editar/${creation.body.id}`,
      {
        method: 'PUT',
        body: { plate: 'DEF4G56', color: 'prata', mark: 'Toyota' },
      }
    );
    assert.equal(update.response.status, 200);
    assert.equal(update.body.plate, 'DEF4G56');
    assert.equal(update.body.color, 'prata');

    const filtered = await requestJson<VehicleResponse[]>(
      '/veiculo?mark=toyota'
    );
    assert.ok(filtered.body.some((vehicle) => vehicle.id === creation.body.id));

    const deleteVehicle = await requestJson<{ message: string }>(
      `/veiculo/deletar/${creation.body.id}`,
      { method: 'DELETE' }
    );
    assert.equal(deleteVehicle.response.status, 200);

    const missingAfterDelete = await requestJson<{ error: string }>(
      `/veiculo/buscar/${creation.body.id}`
    );
    assert.equal(missingAfterDelete.response.status, 404);

    const updateMissing = await requestJson<{ error: string }>(
      '/veiculo/editar/unknown',
      {
        method: 'PUT',
        body: { plate: 'ABC1D23', color: 'azul', mark: 'Fiat' },
      }
    );
    const deleteMissing = await requestJson<{ error: string }>(
      '/veiculo/deletar/unknown',
      { method: 'DELETE' }
    );
    assert.equal(updateMissing.response.status, 404);
    assert.equal(deleteMissing.response.status, 404);
  });

  it('cobre criação, busca, edição e exclusão de motoristas', async () => {
    const creation = await requestJson<DriverResponse>('/motorista/criar', {
      method: 'POST',
      body: { name: 'Marina Costa' },
    });
    assert.equal(creation.response.status, 201);
    assert.equal(creation.body.name, 'Marina Costa');
    assert.equal(creation.body.status, 'available');

    const search = await requestJson<DriverResponse>(
      `/motorista/buscar/${creation.body.id}`
    );
    assert.equal(search.response.status, 200);
    assert.equal(search.body.name, 'Marina Costa');

    const filtered = await requestJson<DriverResponse[]>(
      '/motorista?name=MARINA'
    );
    assert.ok(filtered.body.some((driver) => driver.id === creation.body.id));

    const update = await requestJson<DriverResponse>(
      `/motorista/editar/${creation.body.id}`,
      { method: 'PUT', body: { name: 'Marina Almeida' } }
    );
    assert.equal(update.response.status, 200);
    assert.equal(update.body.name, 'Marina Almeida');

    const deleteDriver = await requestJson<{ message: string }>(
      `/motorista/deletar/${creation.body.id}`,
      { method: 'DELETE' }
    );
    assert.equal(deleteDriver.response.status, 200);

    const missingAfterDelete = await requestJson<{ error: string }>(
      `/motorista/buscar/${creation.body.id}`
    );
    assert.equal(missingAfterDelete.response.status, 404);

    const updateMissing = await requestJson<{ error: string }>(
      '/motorista/editar/unknown',
      { method: 'PUT', body: { name: 'Motorista Teste' } }
    );
    const deleteMissing = await requestJson<{ error: string }>(
      '/motorista/deletar/unknown',
      { method: 'DELETE' }
    );
    assert.equal(updateMissing.response.status, 404);
    assert.equal(deleteMissing.response.status, 404);
  });

  it('impede iniciar um recurso já ocupado e excluí-lo durante o uso', async () => {
    const creation = await requestJson<UsageResponse>(
      '/reserva/veiculo/criar',
      {
        method: 'POST',
        body: {
          vehicleId: 'vehicle-1',
          driverId: 'driver-1',
          reason: 'Visita técnica',
        },
      }
    );
    assert.equal(creation.response.status, 201);

    const updatedVehicle = await requestJson<VehicleResponse>(
      '/veiculo/editar/vehicle-1',
      {
        method: 'PUT',
        body: { plate: 'ABC1D23', color: 'cinza', mark: 'Fiat' },
      }
    );
    const updatedDriver = await requestJson<DriverResponse>(
      '/motorista/editar/driver-1',
      { method: 'PUT', body: { name: 'Ana Costa' } }
    );
    assert.equal(updatedVehicle.body.vehicleInUse, true);
    assert.equal(updatedDriver.body.status, 'usingAVehicle');

    const conflict = await requestJson<{ error: string }>(
      '/reserva/veiculo/criar',
      {
        method: 'POST',
        body: {
          vehicleId: 'vehicle-1',
          driverId: 'driver-2',
          reason: 'Outro serviço',
        },
      }
    );
    assert.equal(conflict.response.status, 409);

    const driverConflict = await requestJson<{ error: string }>(
      '/reserva/veiculo/criar',
      {
        method: 'POST',
        body: {
          vehicleId: 'vehicle-2',
          driverId: 'driver-1',
          reason: 'Outro serviço',
        },
      }
    );
    assert.equal(driverConflict.response.status, 409);

    const deleteVehicle = await requestJson<{ error: string }>(
      '/veiculo/deletar/vehicle-1',
      { method: 'DELETE' }
    );
    const deleteDriver = await requestJson<{ error: string }>(
      '/motorista/deletar/driver-1',
      { method: 'DELETE' }
    );
    assert.equal(deleteVehicle.response.status, 409);
    assert.equal(deleteDriver.response.status, 409);
  });

  it('valida os bodies e aplica filtros de listagem', async () => {
    const invalidVehicle = await requestJson<{ error: string }>(
      '/veiculo/criar',
      {
        method: 'POST',
        body: { plate: 'placa-errada', color: 'azul', mark: 'Fiat' },
      }
    );
    assert.equal(invalidVehicle.response.status, 400);

    const invalidDriver = await requestJson<{ error: string }>(
      '/motorista/criar',
      { method: 'POST', body: { name: '   ' } }
    );
    assert.equal(invalidDriver.response.status, 400);

    const invalidUsage = await requestJson<{ error: string }>(
      '/reserva/veiculo/criar',
      { method: 'POST', body: { vehicleId: 'vehicle-1', driverId: 'driver-1' } }
    );
    assert.equal(invalidUsage.response.status, 400);

    const filteredVehicles = await requestJson<VehicleResponse[]>(
      '/veiculo?plate=abc123&color=AZUL'
    );
    assert.equal(filteredVehicles.response.status, 200);
    assert.deepEqual(
      filteredVehicles.body.map((vehicle) => vehicle.id),
      ['vehicle-1']
    );

    const filteredDrivers = await requestJson<DriverResponse[]>(
      '/motorista?name=ANA'
    );
    assert.equal(filteredDrivers.response.status, 200);
    assert.deepEqual(
      filteredDrivers.body.map((driver) => driver.id),
      ['driver-1']
    );
  });

  it('retorna 404 para veículos, motoristas e utilizações inexistentes', async () => {
    const vehicle = await requestJson<{ error: string }>(
      '/veiculo/buscar/unknown'
    );
    const driver = await requestJson<{ error: string }>(
      '/motorista/buscar/unknown'
    );
    const usage = await requestJson<{ error: string }>(
      '/reserva/veiculo/finalizar/unknown',
      { method: 'PUT' }
    );
    const usageWithMissingVehicle = await requestJson<{ error: string }>(
      '/reserva/veiculo/criar',
      {
        method: 'POST',
        body: {
          vehicleId: 'unknown',
          driverId: 'driver-1',
          reason: 'Teste',
        },
      }
    );
    const usageWithMissingDriver = await requestJson<{ error: string }>(
      '/reserva/veiculo/criar',
      {
        method: 'POST',
        body: {
          vehicleId: 'vehicle-1',
          driverId: 'unknown',
          reason: 'Teste',
        },
      }
    );

    assert.equal(vehicle.response.status, 404);
    assert.equal(driver.response.status, 404);
    assert.equal(usage.response.status, 404);
    assert.equal(usageWithMissingVehicle.response.status, 404);
    assert.equal(usageWithMissingDriver.response.status, 404);
  });
});

async function writeDatabase(fileName: string, data: unknown): Promise<void> {
  const filePath = path.join(
    process.cwd(),
    'src',
    'database',
    fileName
  );
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function requestJson<T>(
  route: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ response: Response; body: T }> {
  const response = await fetch(`${baseUrl}${route}`, {
    method: options.method ?? 'GET',
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const responseText = await response.text();

  return {
    response,
    body: responseText ? (JSON.parse(responseText) as T) : (undefined as T),
  };
}
