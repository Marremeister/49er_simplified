import { z } from 'zod';
import { WAVE_TYPES } from '../constants/waveTypes';

export const sessionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(1, 'Location is required').max(255, 'Location is too long'),
  wind_speed_min: z.number().min(0, 'Wind speed cannot be negative').max(60, 'Wind speed too high'),
  wind_speed_max: z.number().min(0, 'Wind speed cannot be negative').max(60, 'Wind speed too high'),
  wave_type: z.enum(WAVE_TYPES as [string, ...string[]]),
  wave_direction: z.string().min(1, 'Wave direction is required').max(50),
  hours_on_water: z.number().min(0.1, 'Hours must be greater than 0').max(12),
  performance_rating: z.number().min(1).max(5),
  notes: z.string().max(1000).optional(),
}).refine((data) => data.wind_speed_min <= data.wind_speed_max, {
  message: 'Minimum wind speed cannot exceed maximum',
  path: ['wind_speed_min'],
});

export type SessionFormData = z.infer<typeof sessionSchema>;