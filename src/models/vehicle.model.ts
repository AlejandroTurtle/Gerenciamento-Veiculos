export interface VehicleInput {
  plate: string;
  color: string;
  mark: string;
}

export interface Vehicle extends VehicleInput {
  id: string;
  vehicleInUse: boolean;
}

export interface VehicleDatabase {
  vehicles: Vehicle[];
}
