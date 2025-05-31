// src/application/dto/EquipmentDTO.ts
import { EquipmentType } from '../../domain/types/common.types';

export interface CreateEquipmentDTO {
  name: string;
  type: EquipmentType;
  manufacturer: string;
  model: string;
  purchase_date?: string;
  notes?: string;
}

export interface UpdateEquipmentDTO {
  name?: string;
  type?: EquipmentType;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  notes?: string;
}