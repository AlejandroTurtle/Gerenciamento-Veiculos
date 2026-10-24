export interface DriverInput {
  name: string;
}

export interface Driver extends DriverInput {
  id: string;
}

export interface DriverDatabase {
  drivers: Driver[];
}
