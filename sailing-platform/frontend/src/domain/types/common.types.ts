// src/domain/types/common.types.ts
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export type WaveType = 'Flat' | 'Choppy' | 'Medium' | 'Large';
export type EquipmentType = 'Mainsail' | 'Jib' | 'Gennaker' | 'Mast' | 'Boom' | 'Rudder' | 'Centerboard' | 'Other';
export type TensionLevel = 'Loose' | 'Medium' | 'Tight';

export interface ApiError {
  message: string;
  detail?: string;
  status?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// src/domain/types/api.types.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface SessionResponse {
  id: string;
  date: string;
  location: string;
  wind_speed_min: number;
  wind_speed_max: number;
  wave_type: WaveType;
  wave_direction: string;
  hours_on_water: number;
  performance_rating: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentResponse {
  id: string;
  name: string;
  type: EquipmentType;
  manufacturer: string;
  model: string;
  purchase_date?: string;
  notes?: string;
  active: boolean;
  wear: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  age_in_days?: number;
  needs_replacement?: boolean;
}

export interface EquipmentSettingsResponse {
  id: string;
  session_id: string;
  forestay_tension: number;
  shroud_tension: number;
  mast_rake: number;
  main_tension: number;
  cap_tension: number;
  cap_hole: number;
  lowers_scale: number;
  mains_scale: number;
  pre_bend: number;
  jib_halyard_tension: TensionLevel;
  cunningham: number;
  outhaul: number;
  vang: number;
  created_at: string;
}

export interface PerformanceAnalyticsResponse {
  total_sessions: number;
  total_hours: number;
  average_performance: number;
  performance_by_conditions: Record<string, number>;
  sessions_by_location: Record<string, number>;
  equipment_usage: Record<string, number>;
}

export interface EquipmentStatisticsResponse {
  total_equipment: number;
  active_equipment: number;
  retired_equipment: number;
  equipment_by_type: Record<string, number>;
  oldest_equipment?: string;
  newest_equipment?: string;
  most_worn_equipment?: Record<string, number>;
}