import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../application/hooks/useAuth';
import { useSessions } from '../../../application/hooks/useSessions';
import { useEquipment } from '../../../application/hooks/useEquipment';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import {
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessions, loading: sessionsLoading } = useSessions();
  const { equipment, statistics, getEquipmentNeedingReplacement } = useEquipment();

  const [recentSessions, setRecentSessions] = useState<typeof sessions>([]);
  const [equipmentNeedingAttention, setEquipmentNeedingAttention] = useState<typeof equipment>([]);

  useEffect(() => {
    // Get 5 most recent sessions
    const sorted = [...sessions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setRecentSessions(sorted.slice(0, 5));
  }, [sessions]);

  useEffect(() => {
    setEquipmentNeedingAttention(getEquipmentNeedingReplacement());
  }, [equipment, getEquipmentNeedingReplacement]);

  const totalHours = sessions.reduce((sum, s) => sum + s.hoursOnWater, 0);
  const avgPerformance = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + s.performanceRating, 0) / sessions.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's your sailing campaign overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarDaysIcon className="h-12 w-12 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-12 w-12 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Hours on Water</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-12 w-12 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgPerformance.toFixed(1)} / 5.0
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <WrenchScrewdriverIcon className="h-12 w-12 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Equipment</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.active_equipment || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate('/sessions/new')}
            size="large"
            fullWidth
          >
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            Log New Session
          </Button>
          <Button
            onClick={() => navigate('/equipment/new')}
            variant="secondary"
            size="large"
            fullWidth
          >
            <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
            Add Equipment
          </Button>
          <Button
            onClick={() => navigate('/sessions/analytics')}
            variant="ghost"
            size="large"
            fullWidth
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            View Analytics
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Sessions</h2>
            <Button
              variant="ghost"
              size="small"
              onClick={() => navigate('/sessions')}
            >
              View all
            </Button>
          </div>

          {sessionsLoading ? (
            <p className="text-gray-500">Loading sessions...</p>
          ) : recentSessions.length === 0 ? (
            <p className="text-gray-500">No sessions recorded yet</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="border-l-4 border-blue-500 pl-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{session.location}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(session.date).toLocaleDateString()} •
                        {session.windSpeedMin}-{session.windSpeedMax} kts •
                        {session.waveType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {'⭐'.repeat(session.performanceRating)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.hoursOnWater}h
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Equipment Alerts */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Equipment Status</h2>
            <Button
              variant="ghost"
              size="small"
              onClick={() => navigate('/equipment')}
            >
              Manage
            </Button>
          </div>

          {equipmentNeedingAttention.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  {equipmentNeedingAttention.length} item{equipmentNeedingAttention.length > 1 ? 's' : ''} need{equipmentNeedingAttention.length === 1 ? 's' : ''} attention
                </p>
              </div>
            </div>
          )}

          {statistics && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Equipment</span>
                <span className="font-medium">{statistics.total_equipment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active</span>
                <span className="font-medium text-green-600">{statistics.active_equipment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Retired</span>
                <span className="font-medium text-gray-500">{statistics.retired_equipment}</span>
              </div>

              {equipmentNeedingAttention.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Needs Replacement:</p>
                  {equipmentNeedingAttention.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-sm text-gray-600 mb-1">
                      • {item.name} ({item.wear.toFixed(0)}h wear)
                    </div>
                  ))}
                  {equipmentNeedingAttention.length > 3 && (
                    <p className="text-sm text-gray-500 mt-1">
                      ...and {equipmentNeedingAttention.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};