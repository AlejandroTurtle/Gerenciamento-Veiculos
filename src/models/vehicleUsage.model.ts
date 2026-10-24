import type { Driver } from './driver.model';
import type { Vehicle } from './vehicle.model';

export interface UsageInput {
  reason: string;
  vehicleId: string;
  driverId: string;
}

export interface Usage extends UsageInput {
  id: string;
  initialDate: string;
  finalDate: string | null;
}

export interface UsageDatabase {
  usages: Usage[];
}

export interface UsageListItem extends Usage {
  driver: Pick<Driver, 'id' | 'name'> | null;
  vehicle: Pick<Vehicle, 'id' | 'plate' | 'color' | 'mark'> | null;
}
