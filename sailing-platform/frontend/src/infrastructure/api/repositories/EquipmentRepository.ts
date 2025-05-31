// src/infrastructure/api/repositories/EquipmentRepository.ts
import { IEquipmentRepository } from '../../../domain/repositories/IEquipmentRepository';
import { Equipment } from '../../../domain/entities/Equipment';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from '../../../application/dto/EquipmentDTO';
import { ApiClient } from '../client/ApiClient';
import { API_CONFIG } from '../../../config/api.config';
import { PaginationParams, SortParams } from '../../../domain/types/common.types';
import { EquipmentResponse, EquipmentStatisticsResponse } from '../../../domain/types/api.types';

export class EquipmentRepository implements IEquipmentRepository {
  private apiClient: ApiClient;
  private readonly basePath = API_CONFIG.endpoints.equipment.base;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  async create(data: CreateEquipmentDTO): Promise<Equipment> {
    const response = await this.apiClient.post<EquipmentResponse>(this.basePath, data);
    return this.mapToEntity(response);
  }

  async getById(id: string): Promise<Equipment | null> {
    try {
      const response = await this.apiClient.get<EquipmentResponse>(`${this.basePath}/${id}`);
      return this.mapToEntity(response);
    } catch (error) {
      return null;
    }
  }

  async getAll(params?: PaginationParams & SortParams & { activeOnly?: boolean }): Promise<Equipment[]> {
    const queryParams = new URLSearchParams();

    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.activeOnly !== undefined) queryParams.append('active_only', params.activeOnly.toString());

    const response = await this.apiClient.get<EquipmentResponse[]>(
      `${this.basePath}?${queryParams.toString()}`
    );

    return response.map(item => this.mapToEntity(item));
  }

  async update(id: string, data: UpdateEquipmentDTO): Promise<Equipment> {
    const response = await this.apiClient.put<EquipmentResponse>(
      `${this.basePath}/${id}`,
      data
    );
    return this.mapToEntity(response);
  }

  async delete(id: string): Promise<boolean> {
    await this.apiClient.delete(`${this.basePath}/${id}`);
    return true;
  }

  async retire(id: string): Promise<boolean> {
    await this.apiClient.patch(API_CONFIG.endpoints.equipment.retire(id));
    return true;
  }

  async reactivate(id: string): Promise<boolean> {
    await this.apiClient.patch(API_CONFIG.endpoints.equipment.reactivate(id));
    return true;
  }

  async getStatistics(): Promise<EquipmentStatisticsResponse> {
    return this.apiClient.get<EquipmentStatisticsResponse>(
      API_CONFIG.endpoints.equipment.stats
    );
  }

  private mapToEntity(data: EquipmentResponse): Equipment {
    return new Equipment(
      data.id,
      data.name,
      data.type,
      data.manufacturer,
      data.model,
      data.purchase_date,
      data.notes,
      data.active,
      data.wear,
      data.owner_id,
      data.created_at,
      data.updated_at,
      data.age_in_days,
      data.needs_replacement
    );
  }
}

