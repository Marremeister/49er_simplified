// src/application/hooks/useEquipment.ts
import { useState, useCallback, useEffect } from 'react';
import { Equipment } from '../../domain/entities/Equipment';
import { EquipmentService } from '../../domain/services/EquipmentService';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from '../dto/EquipmentDTO';
import { PaginationParams, SortParams } from '../../domain/types/common.types';
import { EquipmentStatisticsResponse } from '../../domain/types/api.types';

interface UseEquipmentReturn {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  statistics: EquipmentStatisticsResponse | null;
  createEquipment: (data: CreateEquipmentDTO) => Promise<Equipment>;
  updateEquipment: (id: string, data: UpdateEquipmentDTO) => Promise<Equipment>;
  deleteEquipment: (id: string) => Promise<void>;
  retireEquipment: (id: string) => Promise<void>;
  reactivateEquipment: (id: string) => Promise<void>;
  refreshEquipment: () => Promise<void>;
  sortEquipment: (sortBy: string, order: 'asc' | 'desc') => void;
  filterActiveOnly: (activeOnly: boolean) => void;
  getEquipmentNeedingReplacement: () => Equipment[];
  getOldEquipment: (thresholdDays?: number) => Equipment[];
}

export const useEquipment = (): UseEquipmentReturn => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<EquipmentStatisticsResponse | null>(null);
  const [params, setParams] = useState<PaginationParams & SortParams & { activeOnly?: boolean }>({
    activeOnly: true,
  });

  const equipmentService = new EquipmentService();

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [equipmentData, statsData] = await Promise.all([
        equipmentService.getAllEquipment(params),
        equipmentService.getEquipmentStatistics(),
      ]);
      setEquipment(equipmentData);
      setStatistics(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const createEquipment = async (data: CreateEquipmentDTO): Promise<Equipment> => {
    setError(null);
    try {
      const newEquipment = await equipmentService.createEquipment(data);
      setEquipment(prev => [newEquipment, ...prev]);
      // Refresh statistics
      const newStats = await equipmentService.getEquipmentStatistics();
      setStatistics(newStats);
      return newEquipment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create equipment');
      throw err;
    }
  };

  const updateEquipment = async (id: string, data: UpdateEquipmentDTO): Promise<Equipment> => {
    setError(null);
    try {
      const updatedEquipment = await equipmentService.updateEquipment(id, data);
      setEquipment(prev => prev.map(e => e.id === id ? updatedEquipment : e));
      return updatedEquipment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update equipment');
      throw err;
    }
  };

  const deleteEquipment = async (id: string): Promise<void> => {
    setError(null);
    try {
      await equipmentService.deleteEquipment(id);
      setEquipment(prev => prev.filter(e => e.id !== id));
      // Refresh statistics
      const newStats = await equipmentService.getEquipmentStatistics();
      setStatistics(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete equipment');
      throw err;
    }
  };

  const retireEquipment = async (id: string): Promise<void> => {
    setError(null);
    try {
      await equipmentService.retireEquipment(id);
      const updatedEquipment = equipment.find(e => e.id === id);
      if (updatedEquipment) {
        updatedEquipment.active = false;
        setEquipment(prev => [...prev]);
      }
      // Refresh statistics
      const newStats = await equipmentService.getEquipmentStatistics();
      setStatistics(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retire equipment');
      throw err;
    }
  };

  const reactivateEquipment = async (id: string): Promise<void> => {
    setError(null);
    try {
      await equipmentService.reactivateEquipment(id);
      const updatedEquipment = equipment.find(e => e.id === id);
      if (updatedEquipment) {
        updatedEquipment.active = true;
        setEquipment(prev => [...prev]);
      }
      // Refresh statistics
      const newStats = await equipmentService.getEquipmentStatistics();
      setStatistics(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate equipment');
      throw err;
    }
  };

  const sortEquipment = (sortBy: string, order: 'asc' | 'desc') => {
    setParams(prev => ({ ...prev, sortBy, order }));
  };

  const filterActiveOnly = (activeOnly: boolean) => {
    setParams(prev => ({ ...prev, activeOnly }));
  };

  const getEquipmentNeedingReplacement = () => {
    return equipmentService.getEquipmentNeedingReplacement(equipment);
  };

  const getOldEquipment = (thresholdDays?: number) => {
    return equipmentService.getOldEquipment(equipment, thresholdDays);
  };

  return {
    equipment,
    loading,
    error,
    statistics,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    retireEquipment,
    reactivateEquipment,
    refreshEquipment: fetchEquipment,
    sortEquipment,
    filterActiveOnly,
    getEquipmentNeedingReplacement,
    getOldEquipment,
  };
};