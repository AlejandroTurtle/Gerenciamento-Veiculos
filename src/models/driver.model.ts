export enum DriverStatusEnum {
  USING_A_VEHICLE = 'usingAVehicle',
  AVAILABLE = 'available',
}
export interface DriverInput {
  name: string;
}

export interface Driver extends DriverInput {
  id: string;
  status: DriverStatusEnum;
}

export interface DriverDatabase {
  drivers: Driver[];
}
