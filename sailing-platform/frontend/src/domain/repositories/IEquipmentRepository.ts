// src/domain/repositories/IEquipmentRepository.ts
import { Equipment } from '../entities/Equipment';
import { PaginationParams, SortParams } from '../types/common.types';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from '../../application/dto/EquipmentDTO';
import { EquipmentStatisticsResponse } from '../types/api.types';

export interface IEquipmentRepository {
  create(data: CreateEquipmentDTO): Promise<Equipment>;
  getById(id: string): Promise<Equipment | null>;
  getAll(params?: PaginationParams & SortParams & { activeOnly?: boolean }): Promise<Equipment[]>;
  update(id: string, data: UpdateEquipmentDTO): Promise<Equipment>;
  delete(id: string): Promise<boolean>;
  retire(id: string): Promise<boolean>;
  reactivate(id: string): Promise<boolean>;
  getStatistics(): Promise<EquipmentStatisticsResponse>;
}

