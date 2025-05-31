import { ISessionRepository } from '../repositories/ISessionRepository';
import { Session } from '../entities/Session';
import { EquipmentSettings } from '../entities/EquipmentSettings';
import { Equipment } from '../entities/Equipment';
import { CreateSessionDTO, UpdateSessionDTO } from '../../application/dto/SessionDTO';
import { SessionRepository } from '../../infrastructure/api/repositories/SessionRepository';
import { PaginationParams, SortParams } from '../types/common.types';
import { PerformanceAnalyticsResponse } from '../types/api.types';

export class SessionService {
  private repository: ISessionRepository;

  constructor(repository?: ISessionRepository) {
    this.repository = repository || new SessionRepository();
  }

  async createSession(data: CreateSessionDTO): Promise<Session> {
    // Validate data
    if (!data.location || data.location.trim().length === 0) {
      throw new Error('Location is required');
    }

    if (data.wind_speed_min < 0 || data.wind_speed_max < 0) {
      throw new Error('Wind speeds cannot be negative');
    }

    if (data.wind_speed_min > data.wind_speed_max) {
      throw new Error('Minimum wind speed cannot exceed maximum');
    }

    if (data.hours_on_water <= 0 || data.hours_on_water > 12) {
      throw new Error('Hours on water must be between 0 and 12');
    }

    if (data.performance_rating < 1 || data.performance_rating > 5) {
      throw new Error('Performance rating must be between 1 and 5');
    }

    return this.repository.create(data);
  }

  async getSessionById(id: string): Promise<Session | null> {
    return this.repository.getById(id);
  }

  async getAllSessions(params?: PaginationParams & SortParams): Promise<Session[]> {
    return this.repository.getAll(params);
  }

  async updateSession(id: string, data: UpdateSessionDTO): Promise<Session> {
    // Validate update data
    if (data.wind_speed_min !== undefined && data.wind_speed_max !== undefined) {
      if (data.wind_speed_min > data.wind_speed_max) {
        throw new Error('Minimum wind speed cannot exceed maximum');
      }
    }

    if (data.hours_on_water !== undefined) {
      if (data.hours_on_water <= 0 || data.hours_on_water > 12) {
        throw new Error('Hours on water must be between 0 and 12');
      }
    }

    if (data.performance_rating !== undefined) {
      if (data.performance_rating < 1 || data.performance_rating > 5) {
        throw new Error('Performance rating must be between 1 and 5');
      }
    }

    return this.repository.update(id, data);
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async getSessionWithSettings(id: string): Promise<{ session: Session; settings?: EquipmentSettings }> {
    return this.repository.getWithSettings(id);
  }

  async getSessionEquipment(id: string): Promise<Equipment[]> {
    return this.repository.getSessionEquipment(id);
  }

  async createEquipmentSettings(sessionId: string, data: any): Promise<EquipmentSettings> {
    // Validate settings data
    const tensions = [
      'forestay_tension', 'shroud_tension', 'main_tension',
      'cap_tension', 'lowers_scale', 'mains_scale',
      'cunningham', 'outhaul', 'vang'
    ];

    for (const tension of tensions) {
      if (data[tension] !== undefined) {
        if (data[tension] < 0 || data[tension] > 10) {
          throw new Error(`${tension} must be between 0 and 10`);
        }
      }
    }

    if (data.mast_rake !== undefined) {
      if (data.mast_rake < -5 || data.mast_rake > 30) {
        throw new Error('Mast rake must be between -5 and 30 degrees');
      }
    }

    return this.repository.createSettings(sessionId, data);
  }

  async getPerformanceAnalytics(startDate?: string, endDate?: string): Promise<PerformanceAnalyticsResponse> {
    return this.repository.getAnalytics(startDate, endDate);
  }

  // Business logic methods
  getSessionsByCondition(sessions: Session[], condition: 'heavy' | 'light' | 'medium'): Session[] {
    switch (condition) {
      case 'heavy':
        return sessions.filter(s => s.isHeavyWeather);
      case 'light':
        return sessions.filter(s => s.isLightWeather);
      case 'medium':
        return sessions.filter(s => !s.isHeavyWeather && !s.isLightWeather);
      default:
        return sessions;
    }
  }

  getTopRatedSessions(sessions: Session[], minRating: number = 4): Session[] {
    return sessions.filter(s => s.performanceRating >= minRating);
  }

  calculateAveragePerformance(sessions: Session[]): number {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + s.performanceRating, 0);
    return total / sessions.length;
  }

  calculateTotalHours(sessions: Session[]): number {
    return sessions.reduce((sum, s) => sum + s.hoursOnWater, 0);
  }
}