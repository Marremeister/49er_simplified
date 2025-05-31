// src/utils/formatters/dateFormatter.ts
import { format, parseISO } from 'date-fns';
import { APP_CONFIG } from '../../config/app.config';

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, APP_CONFIG.displayDateFormat);
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const formatDateForInput = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, APP_CONFIG.dateFormat);
};