import VehicleService, {
  DuplicateVehiclePlateError,
} from '../src/services/vehicle.service';
import type { Vehicle } from '../src/models/vehicle.model';

const vehicleService = new VehicleService();

const colors = [
  'branco',
  'preto',
  'prata',
  'cinza',
  'vermelho',
  'azul',
  'verde',
];

const marks = [
  'Chevrolet',
  'Fiat',
  'Ford',
  'Honda',
  'Hyundai',
  'Nissan',
  'Toyota',
  'Volkswagen',
];

function getRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generatePlate(): string {
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  const numbers = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `${letters}-${numbers}`;
}

async function seedVehicles(): Promise<void> {
  const createdVehicles: Vehicle[] = [];
  let attempts = 0;

  while (createdVehicles.length < 10) {
    attempts += 1;

    if (attempts > 1000) {
      throw new Error('Não foi possível gerar 10 placas únicas.');
    }

    try {
      const vehicle = await vehicleService.createVehicle({
        plate: generatePlate(),
        color: getRandomItem(colors),
        mark: getRandomItem(marks),
      });

      createdVehicles.push(vehicle);
    } catch (error) {
      if (error instanceof DuplicateVehiclePlateError) {
        continue;
      }

      throw error;
    }
  }

  console.table(
    createdVehicles.map(({ plate, color, mark }) => ({ plate, color, mark }))
  );
  console.log('10 veículos foram adicionados ao banco local.');
}

seedVehicles().catch((error: unknown) => {
  console.error('Não foi possível criar os veículos de exemplo.', error);
  process.exitCode = 1;
});
