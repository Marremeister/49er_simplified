import { z } from 'zod';
import { EQUIPMENT_TYPES } from '../constants/equipmentTypes';

export const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  type: z.enum(EQUIPMENT_TYPES as [string, ...string[]]),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  purchase_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>;