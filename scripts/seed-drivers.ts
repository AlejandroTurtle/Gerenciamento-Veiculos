import DriverService from '../src/services/driver.service';
import type { Driver } from '../src/models/driver.model';

const driverService = new DriverService();

const firstNames = [
  'Alice',
  'Bruno',
  'Camila',
  'Diego',
  'Elisa',
  'Felipe',
  'Gabriela',
  'Hugo',
  'Isabela',
  'João',
  'Larissa',
  'Marcos',
  'Natália',
  'Otávio',
  'Patrícia',
  'Rafael',
  'Sofia',
  'Thiago',
  'Vitória',
  'Yuri',
];

const lastNames = [
  'Almeida',
  'Barros',
  'Carvalho',
  'Dias',
  'Ferreira',
  'Gomes',
  'Lima',
  'Martins',
  'Nunes',
  'Oliveira',
  'Pereira',
  'Ribeiro',
  'Santos',
  'Teixeira',
  'Vieira',
];

function getRandomItem(items: readonly string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}

async function seedDrivers(): Promise<void> {
  const createdDrivers: Driver[] = [];

  for (let index = 0; index < 10; index += 1) {
    const driver = await driverService.createDriver({
      name: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
    });
    createdDrivers.push(driver);
  }

  console.table(createdDrivers);
  console.log('10 motoristas foram adicionados ao banco local.');
}

seedDrivers().catch((error: unknown) => {
  console.error('Não foi possível criar os motoristas de exemplo.', error);
  process.exitCode = 1;
});
