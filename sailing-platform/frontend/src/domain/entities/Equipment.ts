// src/domain/entities/Equipment.ts
import { EquipmentType } from '../types/common.types';

export interface IEquipment {
  id: string;
  name: string;
  type: EquipmentType;
  manufacturer: string;
  model: string;
  purchaseDate?: string;
  notes?: string;
  active: boolean;
  wear: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  ageInDays?: number;
  needsReplacement?: boolean;
}

export class Equipment implements IEquipment {
  constructor(
    public id: string,
    public name: string,
    public type: EquipmentType,
    public manufacturer: string,
    public model: string,
    public purchaseDate: string | undefined,
    public notes: string | undefined,
    public active: boolean,
    public wear: number,
    public ownerId: string,
    public createdAt: string,
    public updatedAt: string,
    public ageInDays?: number,
    public needsReplacement?: boolean
  ) {}

  isOld(thresholdDays: number = 730): boolean {
    return this.ageInDays ? this.ageInDays > thresholdDays : false;
  }

  shouldReplace(wearThreshold: number = 500): boolean {
    return this.wear > wearThreshold || this.needsReplacement === true;
  }
}
