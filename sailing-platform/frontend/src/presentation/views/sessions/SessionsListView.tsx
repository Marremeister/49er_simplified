import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../../../application/hooks/useSessions';
import { Table, Column } from '../../components/common/Table/Table';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Session } from '../../../domain/entities/Session';
import { formatDate } from '../../../utils/formatters/dateFormatter';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const SessionsListView: React.FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    loading,
    error,
    deleteSession,
    refreshSessions,
    sortSessions,
  } = useSessions();

  const [currentSort, setCurrentSort] = useState<{ column: string; order: 'asc' | 'desc' }>({
    column: 'date',
    order: 'desc',
  });

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setCurrentSort({ column, order });
    sortSessions(column, order);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await deleteSession(sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const columns: Column<Session>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (session) => formatDate(session.date),
      sortable: true,
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
    },
    {
      key: 'windSpeedMin',
      header: 'Wind (kts)',
      render: (session) => `${session.windSpeedMin}-${session.windSpeedMax}`,
      sortable: true,
    },
    {
      key: 'waveType',
      header: 'Waves',
      render: (session) => (
        <span className="inline-flex items-center">
          {session.waveType}
          {session.waveDirection && (
            <span className="text-gray-500 text-sm ml-1">({session.waveDirection})</span>
          )}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'hoursOnWater',
      header: 'Hours',
      render: (session) => session.hoursOnWater.toFixed(1),
      sortable: true,
    },
    {
      key: 'performanceRating',
      header: 'Performance',
      render: (session) => (
        <span className="text-yellow-500">
          {'⭐'.repeat(session.performanceRating)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'equipmentIds',
      header: 'Equipment',
      render: (session) => (
        <span className="text-sm text-gray-600">
          {session.equipmentIds.length} items
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (session) => (
        <div className="flex space-x-2">
          <Button
            size="small"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/sessions/${session.id}/edit`);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="danger"
            onClick={(e) => handleDeleteSession(e, session.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const totalHours = sessions.reduce((sum, s) => sum + s.hoursOnWater, 0);
  const avgPerformance = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + s.performanceRating, 0) / sessions.length
    : 0;

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sailing Sessions</h1>
        <div className="flex space-x-4">
          <Button
            variant="ghost"
            onClick={refreshSessions}
            disabled={loading}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/sessions/new')}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="small">
          <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
          <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
        </Card>
        <Card padding="small">
          <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
          <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
        </Card>
        <Card padding="small">
          <h3 className="text-sm font-medium text-gray-500">Avg Performance</h3>
          <p className="text-2xl font-bold text-gray-900">
            {avgPerformance.toFixed(1)} / 5.0
          </p>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <Table
          data={sessions}
          columns={columns}
          onSort={handleSort}
          currentSort={currentSort}
          keyExtractor={(session) => session.id}
          onRowClick={(session) => navigate(`/sessions/${session.id}`)}
          loading={loading}
          emptyMessage="No sessions recorded yet. Click 'New Session' to log your first sailing session."
        />
      </Card>
    </div>
  );
};