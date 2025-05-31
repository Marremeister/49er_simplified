import { WaveType, TensionLevel } from '../../domain/types/common.types';

export interface CreateSessionDTO {
  date: string;
  location: string;
  wind_speed_min: number;
  wind_speed_max: number;
  wave_type: WaveType;
  wave_direction: string;
  hours_on_water: number;
  performance_rating: number;
  notes?: string;
  equipment_ids?: string[];
}

export interface UpdateSessionDTO {
  date?: string;
  location?: string;
  wind_speed_min?: number;
  wind_speed_max?: number;
  wave_type?: WaveType;
  wave_direction?: string;
  hours_on_water?: number;
  performance_rating?: number;
  notes?: string;
  equipment_ids?: string[];
}

export interface CreateEquipmentSettingsDTO {
  forestay_tension: number;
  shroud_tension: number;
  mast_rake: number;
  main_tension?: number;
  cap_tension?: number;
  cap_hole?: number;
  lowers_scale?: number;
  mains_scale?: number;
  pre_bend?: number;
  jib_halyard_tension: TensionLevel;
  cunningham: number;
  outhaul: number;
  vang: number;
}