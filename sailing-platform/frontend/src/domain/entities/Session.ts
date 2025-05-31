// src/domain/entities/Session.ts
import { WaveType } from '../types/common.types';

export interface ISession {
  id: string;
  date: string;
  location: string;
  windSpeedMin: number;
  windSpeedMax: number;
  waveType: WaveType;
  waveDirection: string;
  hoursOnWater: number;
  performanceRating: number;
  notes?: string;
  equipmentIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class Session implements ISession {
  constructor(
    public id: string,
    public date: string,
    public location: string,
    public windSpeedMin: number,
    public windSpeedMax: number,
    public waveType: WaveType,
    public waveDirection: string,
    public hoursOnWater: number,
    public performanceRating: number,
    public notes: string | undefined,
    public equipmentIds: string[],
    public createdBy: string,
    public createdAt: string,
    public updatedAt: string
  ) {}

  get averageWindSpeed(): number {
    return (this.windSpeedMin + this.windSpeedMax) / 2;
  }

  get windRange(): number {
    return this.windSpeedMax - this.windSpeedMin;
  }

  get isHeavyWeather(): boolean {
    return this.averageWindSpeed > 20 || this.waveType === 'Large' || this.waveType === 'Medium';
  }

  get isLightWeather(): boolean {
    return this.averageWindSpeed < 8 && (this.waveType === 'Flat' || this.waveType === 'Choppy');
  }

  isGoodPerformance(): boolean {
    return this.performanceRating >= 4;
  }

  isPoorPerformance(): boolean {
    return this.performanceRating <= 2;
  }

  getConditionsSummary(): string {
    const conditions: string[] = [];

    if (this.isHeavyWeather) {
      conditions.push('Heavy');
    } else if (this.isLightWeather) {
      conditions.push('Light');
    } else {
      conditions.push('Medium');
    }

    conditions.push(`${this.windSpeedMin}-${this.windSpeedMax}kts`);
    conditions.push(this.waveType);

    return conditions.join(' • ');
  }
}