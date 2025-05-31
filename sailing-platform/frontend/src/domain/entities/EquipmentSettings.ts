// src/domain/entities/EquipmentSettings.ts
import { TensionLevel } from '../types/common.types';

export interface IEquipmentSettings {
  id: string;
  sessionId: string;
  forestayTension: number;
  shroudTension: number;
  mastRake: number;
  mainTension: number;
  capTension: number;
  capHole: number;
  lowersScale: number;
  mainsScale: number;
  preBend: number;
  jibHalyardTension: TensionLevel;
  cunningham: number;
  outhaul: number;
  vang: number;
  createdAt: string;
}

export class EquipmentSettings implements IEquipmentSettings {
  constructor(
    public id: string,
    public sessionId: string,
    public forestayTension: number,
    public shroudTension: number,
    public mastRake: number,
    public mainTension: number,
    public capTension: number,
    public capHole: number,
    public lowersScale: number,
    public mainsScale: number,
    public preBend: number,
    public jibHalyardTension: TensionLevel,
    public cunningham: number,
    public outhaul: number,
    public vang: number,
    public createdAt: string
  ) {}

  get isHeavyWeatherSetup(): boolean {
    return (
      this.forestayTension > 7 &&
      this.cunningham > 6 &&
      this.vang > 7 &&
      this.mainTension > 6
    );
  }

  get isLightWeatherSetup(): boolean {
    return (
      this.forestayTension < 4 &&
      this.cunningham < 3 &&
      this.jibHalyardTension === 'Loose' &&
      this.mainTension < 3
    );
  }
}

