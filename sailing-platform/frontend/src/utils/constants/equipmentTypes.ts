// src/utils/constants/equipmentTypes.ts
export const EQUIPMENT_TYPES = [
  'Mainsail',
  'Jib',
  'Gennaker',
  'Mast',
  'Boom',
  'Rudder',
  'Centerboard',
  'Other',
] as const;

export type EquipmentTypeConstant = typeof EQUIPMENT_TYPES[number];