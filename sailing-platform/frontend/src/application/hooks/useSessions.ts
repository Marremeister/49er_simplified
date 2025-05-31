import { useState, useCallback, useEffect } from 'react';
import { Session } from '../../domain/entities/Session';
import { SessionService } from '../../domain/services/SessionService';
import { CreateSessionDTO, UpdateSessionDTO } from '../dto/SessionDTO';
import { PaginationParams, SortParams } from '../../domain/types/common.types';

interface UseSessionsReturn {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  createSession: (data: CreateSessionDTO) => Promise<Session>;
  updateSession: (id: string, data: UpdateSessionDTO) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  sortSessions: (sortBy: string, order: 'asc' | 'desc') => void;
}

export const useSessions = (): UseSessionsReturn => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortParams, setSortParams] = useState<SortParams>({});

  const sessionService = new SessionService();

  const fetchSessions = useCallback(async (params?: PaginationParams & SortParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getAllSessions(params);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(sortParams);
  }, [fetchSessions, sortParams]);

  const createSession = async (data: CreateSessionDTO): Promise<Session> => {
    setError(null);
    try {
      const newSession = await sessionService.createSession(data);
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    }
  };

  const updateSession = async (id: string, data: UpdateSessionDTO): Promise<Session> => {
    setError(null);
    try {
      const updatedSession = await sessionService.updateSession(id, data);
      setSessions(prev => prev.map(s => s.id === id ? updatedSession : s));
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
      throw err;
    }
  };

  const deleteSession = async (id: string): Promise<void> => {
    setError(null);
    try {
      await sessionService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
  };

  const sortSessions = (sortBy: string, order: 'asc' | 'desc') => {
    setSortParams({ sortBy, order });
  };

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refreshSessions: () => fetchSessions(sortParams),
    sortSessions,
  };
};