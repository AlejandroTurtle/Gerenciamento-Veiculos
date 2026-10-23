export interface VehicleInput {
  plate: string;
  color: string;
  mark: string;
}

export interface Vehicle extends VehicleInput {
  id: string;
}

export interface VehicleDatabase {
  vehicles: Vehicle[];
}
