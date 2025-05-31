// src/domain/repositories/ISessionRepository.ts
import { Session } from '../entities/Session';
import { EquipmentSettings } from '../entities/EquipmentSettings';
import { Equipment } from '../entities/Equipment';
import { PaginationParams, SortParams } from '../types/common.types';
import { CreateSessionDTO, UpdateSessionDTO } from '../../application/dto/SessionDTO';
import { PerformanceAnalyticsResponse } from '../types/api.types';

export interface ISessionRepository {
  create(data: CreateSessionDTO): Promise<Session>;
  getById(id: string): Promise<Session | null>;
  getAll(params?: PaginationParams & SortParams): Promise<Session[]>;
  update(id: string, data: UpdateSessionDTO): Promise<Session>;
  delete(id: string): Promise<boolean>;
  getWithSettings(id: string): Promise<{ session: Session; settings?: EquipmentSettings }>;
  getSessionEquipment(id: string): Promise<Equipment[]>;
  createSettings(sessionId: string, data: any): Promise<EquipmentSettings>;
  getAnalytics(startDate?: string, endDate?: string): Promise<PerformanceAnalyticsResponse>;
}

