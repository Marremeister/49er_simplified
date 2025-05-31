// src/domain/services/EquipmentService.ts
import { IEquipmentRepository } from '../repositories/IEquipmentRepository';
import { Equipment } from '../entities/Equipment';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from '../../application/dto/EquipmentDTO';
import { EquipmentRepository } from '../../infrastructure/api/repositories/EquipmentRepository';
import { PaginationParams, SortParams } from '../types/common.types';
import { EquipmentStatisticsResponse } from '../types/api.types';

export class EquipmentService {
  private repository: IEquipmentRepository;

  constructor(repository?: IEquipmentRepository) {
    this.repository = repository || new EquipmentRepository();
  }

  async createEquipment(data: CreateEquipmentDTO): Promise<Equipment> {
    // Validate data
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Equipment name is required');
    }
    if (data.name.length > 100) {
      throw new Error('Equipment name is too long');
    }

    return this.repository.create(data);
  }

  async getEquipmentById(id: string): Promise<Equipment | null> {
    return this.repository.getById(id);
  }

  async getAllEquipment(
    params?: PaginationParams & SortParams & { activeOnly?: boolean }
  ): Promise<Equipment[]> {
    return this.repository.getAll(params);
  }

  async updateEquipment(id: string, data: UpdateEquipmentDTO): Promise<Equipment> {
    // Validate update data
    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new Error('Equipment name cannot be empty');
      }
      if (data.name.length > 100) {
        throw new Error('Equipment name is too long');
      }
    }

    return this.repository.update(id, data);
  }

  async deleteEquipment(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async retireEquipment(id: string): Promise<boolean> {
    return this.repository.retire(id);
  }

  async reactivateEquipment(id: string): Promise<boolean> {
    return this.repository.reactivate(id);
  }

  async getEquipmentStatistics(): Promise<EquipmentStatisticsResponse> {
    return this.repository.getStatistics();
  }

  // Business logic methods
  getEquipmentByWear(equipment: Equipment[], maxWear: number): Equipment[] {
    return equipment.filter(e => e.wear <= maxWear);
  }

  getEquipmentNeedingReplacement(equipment: Equipment[]): Equipment[] {
    return equipment.filter(e => e.shouldReplace());
  }

  getOldEquipment(equipment: Equipment[], thresholdDays: number = 730): Equipment[] {
    return equipment.filter(e => e.isOld(thresholdDays));
  }

  groupEquipmentByType(equipment: Equipment[]): Record<string, Equipment[]> {
    return equipment.reduce((acc, e) => {
      if (!acc[e.type]) {
        acc[e.type] = [];
      }
      acc[e.type].push(e);
      return acc;
    }, {} as Record<string, Equipment[]>);
  }
}

