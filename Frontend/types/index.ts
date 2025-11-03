// Frontend types for machine learning prediction
export interface SensorData {
  temperature: number;
  pressure: number;
  vibration: number;
}

export interface PredictionRequest {
  temperature: number;
  pressure: number;
  vibration: number;
}

export interface PredictionResponse {
  prediction: number; // 0 = no failure, 1 = failure
  probability_no_failure: number;
  probability_failure: number;
}

export interface ApiError {
  error: string;
}

// Machine types - 4 specific mining machines
export type MachineType = 'Haul Truck' | 'Drill Rig' | 'Shovel/Excavator' | 'Crusher';

export interface MachineFailureTypes {
  'Haul Truck': 'engine_breakdown' | 'hydraulic_leak' | 'tire_wear' | 'transmission_fault';
  'Drill Rig': 'drill_bit_wear' | 'hydraulic_system_failure' | 'motor_fault';
  'Shovel/Excavator': 'hydraulic_pump_failure' | 'bucket_arm_wear' | 'electrical_issue';
  'Crusher': 'bearing_failure' | 'liner_wear' | 'motor_overheating' | 'conveyor_jam';
}

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  status: 'online' | 'offline' | 'maintenance';
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  operatingHours: number;
  efficiency: number;
  temperature: number;
  pressure: number;
  vibration: number;
  commonFailures?: string[];
  predictedFailureType?: keyof MachineFailureTypes[MachineType];
  failureRisk?: number; // 0-100 percentage
}

export interface MachineFilters {
  type: string;
  status: string;
  healthStatus: string;
  location: string;
}

// Machine Vitals types
export interface MachineVitals {
  temperature: number;
  pressure: number;
  vibration: number;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

// Dashboard specific types
export interface MachineOverview {
  totalMachines: number;
  onlineMachines: number;
  criticalMachines: number;
  maintenanceDue: number;
}

export interface FailurePrediction {
  machineId: string;
  machineName: string;
  machineType: MachineType;
  failureType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  estimatedTimeToFailure: string;
  recommendedActions: string[];
}
