import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { Session } from '../../../domain/entities/Session';
import { EquipmentSettings } from '../../../domain/entities/EquipmentSettings';
import { Equipment } from '../../../domain/entities/Equipment';
import { CreateSessionDTO, UpdateSessionDTO } from '../../../application/dto/SessionDTO';
import { ApiClient } from '../client/ApiClient';
import { API_CONFIG } from '../../../config/api.config';
import { PaginationParams, SortParams } from '../../../domain/types/common.types';
import { SessionResponse, EquipmentSettingsResponse, EquipmentResponse, PerformanceAnalyticsResponse } from '../../../domain/types/api.types';

export class SessionRepository implements ISessionRepository {
  private apiClient: ApiClient;
  private readonly basePath = API_CONFIG.endpoints.sessions.base;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  async create(data: CreateSessionDTO): Promise<Session> {
    const response = await this.apiClient.post<SessionResponse>(this.basePath, data);
    return this.mapToEntity(response);
  }

  async getById(id: string): Promise<Session | null> {
    try {
      const response = await this.apiClient.get<SessionResponse>(`${this.basePath}/${id}`);
      return this.mapToEntity(response);
    } catch (error) {
      return null;
    }
  }

  async getAll(params?: PaginationParams & SortParams): Promise<Session[]> {
    const queryParams = new URLSearchParams();

    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params?.order) queryParams.append('order', params.order);

    const response = await this.apiClient.get<SessionResponse[]>(
      `${this.basePath}?${queryParams.toString()}`
    );

    return response.map(item => this.mapToEntity(item));
  }

  async update(id: string, data: UpdateSessionDTO): Promise<Session> {
    const response = await this.apiClient.put<SessionResponse>(
      `${this.basePath}/${id}`,
      data
    );
    return this.mapToEntity(response);
  }

  async delete(id: string): Promise<boolean> {
    await this.apiClient.delete(`${this.basePath}/${id}`);
    return true;
  }

  async getWithSettings(id: string): Promise<{ session: Session; settings?: EquipmentSettings }> {
    const response = await this.apiClient.get<{
      id: string;
      date: string;
      location: string;
      wind_speed_min: number;
      wind_speed_max: number;
      wave_type: any;
      wave_direction: string;
      hours_on_water: number;
      performance_rating: number;
      notes?: string;
      created_by: string;
      created_at: string;
      updated_at: string;
      equipment_settings?: EquipmentSettingsResponse;
      equipment_used: EquipmentResponse[];
    }>(`${this.basePath}/${id}`);

    const session = this.mapToEntity({
      id: response.id,
      date: response.date,
      location: response.location,
      wind_speed_min: response.wind_speed_min,
      wind_speed_max: response.wind_speed_max,
      wave_type: response.wave_type,
      wave_direction: response.wave_direction,
      hours_on_water: response.hours_on_water,
      performance_rating: response.performance_rating,
      notes: response.notes,
      created_by: response.created_by,
      created_at: response.created_at,
      updated_at: response.updated_at,
    });

    // Add equipment IDs to session
    session.equipmentIds = response.equipment_used.map(eq => eq.id);

    const settings = response.equipment_settings
      ? this.mapSettingsToEntity(response.equipment_settings)
      : undefined;

    return { session, settings };
  }

  async getSessionEquipment(id: string): Promise<Equipment[]> {
    const response = await this.apiClient.get<EquipmentResponse[]>(
      API_CONFIG.endpoints.sessions.equipment(id)
    );

    return response.map(item => new Equipment(
      item.id,
      item.name,
      item.type,
      item.manufacturer,
      item.model,
      item.purchase_date,
      item.notes,
      item.active,
      item.wear,
      item.owner_id,
      item.created_at,
      item.updated_at,
      item.age_in_days,
      item.needs_replacement
    ));
  }

  async createSettings(sessionId: string, data: any): Promise<EquipmentSettings> {
    const response = await this.apiClient.post<EquipmentSettingsResponse>(
      API_CONFIG.endpoints.sessions.settings(sessionId),
      data
    );
    return this.mapSettingsToEntity(response);
  }

  async getAnalytics(startDate?: string, endDate?: string): Promise<PerformanceAnalyticsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.apiClient.get<PerformanceAnalyticsResponse>(
      `${API_CONFIG.endpoints.sessions.analytics}?${params.toString()}`
    );
  }

  private mapToEntity(data: SessionResponse): Session {
    return new Session(
      data.id,
      data.date,
      data.location,
      data.wind_speed_min,
      data.wind_speed_max,
      data.wave_type,
      data.wave_direction,
      data.hours_on_water,
      data.performance_rating,
      data.notes,
      [], // Equipment IDs populated separately when needed
      data.created_by,
      data.created_at,
      data.updated_at
    );
  }

  private mapSettingsToEntity(data: EquipmentSettingsResponse): EquipmentSettings {
    return new EquipmentSettings(
      data.id,
      data.session_id,
      data.forestay_tension,
      data.shroud_tension,
      data.mast_rake,
      data.main_tension,
      data.cap_tension,
      data.cap_hole,
      data.lowers_scale,
      data.mains_scale,
      data.pre_bend,
      data.jib_halyard_tension,
      data.cunningham,
      data.outhaul,
      data.vang,
      data.created_at
    );
  }
}