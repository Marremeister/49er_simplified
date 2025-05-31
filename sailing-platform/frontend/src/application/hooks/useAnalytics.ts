import { useState, useCallback, useEffect } from 'react';
import { SessionService } from '../../domain/services/SessionService';
import { PerformanceAnalyticsResponse } from '../../domain/types/api.types';

interface UseAnalyticsReturn {
  analytics: PerformanceAnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  fetchAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<PerformanceAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionService = new SessionService();

  const fetchAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getPerformanceAnalytics(startDate, endDate);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
  };
};