// src/presentation/views/sessions/SessionAnalyticsView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../../application/hooks/useAnalytics';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  ArrowLeftIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../../utils/formatters/dateFormatter';

export const SessionAnalyticsView: React.FC = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, fetchAnalytics } = useAnalytics();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const handleDateRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(dateRange.startDate || undefined, dateRange.endDate || undefined);
  };

  const handleResetDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'heavy':
        return 'text-red-600 bg-red-50';
      case 'light':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/sessions')}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <form onSubmit={handleDateRangeSubmit} className="flex items-end space-x-4">
          <div className="flex-1">
            <Input
              type="date"
              label="Start Date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex-1">
            <Input
              type="date"
              label="End Date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              min={dateRange.startDate}
            />
          </div>
          <Button type="submit">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Apply Filter
          </Button>
          <Button type="button" variant="ghost" onClick={handleResetDateRange}>
            Reset
          </Button>
        </form>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-12 w-12 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_sessions}</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-12 w-12 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_hours.toFixed(1)}</p>
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
                {analytics.average_performance.toFixed(1)} / 5.0
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-12 w-12 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Hours/Session</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.total_sessions > 0
                  ? (analytics.total_hours / analytics.total_sessions).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance by Conditions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <ChartBarIcon className="h-6 w-6 mr-2 text-gray-600" />
          Performance by Conditions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analytics.performance_by_conditions).map(([condition, rating]) => (
            <div
              key={condition}
              className={`p-4 rounded-lg ${getConditionColor(condition)}`}
            >
              <h3 className="font-medium capitalize mb-2">{condition} Conditions</h3>
              <div className="flex items-center">
                <span className="text-3xl font-bold">{rating.toFixed(1)}</span>
                <span className="text-lg ml-2">/ 5.0</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl">
                  {'⭐'.repeat(Math.round(rating))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions by Location */}
        <Card>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MapPinIcon className="h-6 w-6 mr-2 text-gray-600" />
            Sessions by Location
          </h2>
          {Object.keys(analytics.sessions_by_location).length === 0 ? (
            <p className="text-gray-500">No location data available</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.sessions_by_location)
                .sort(([, a], [, b]) => b - a)
                .map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between">
                    <span className="text-gray-700">{location}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / analytics.total_sessions) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Equipment Usage */}
        <Card>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <WrenchScrewdriverIcon className="h-6 w-6 mr-2 text-gray-600" />
            Equipment Usage
          </h2>
          {Object.keys(analytics.equipment_usage).length === 0 ? (
            <p className="text-gray-500">No equipment usage data available</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.equipment_usage)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([equipment, count]) => (
                  <div key={equipment} className="flex items-center justify-between">
                    <span className="text-gray-700 text-sm">{equipment}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(analytics.equipment_usage))) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              {Object.keys(analytics.equipment_usage).length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  ...and {Object.keys(analytics.equipment_usage).length - 10} more
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Best Performance Conditions</h3>
            <p className="text-blue-700">
              {Object.entries(analytics.performance_by_conditions).length > 0
                ? (() => {
                    const best = Object.entries(analytics.performance_by_conditions)
                      .sort(([, a], [, b]) => b - a)[0];
                    return `You perform best in ${best[0]} conditions with an average rating of ${best[1].toFixed(1)}/5.0`;
                  })()
                : 'Not enough data to determine best conditions'
              }
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Favorite Location</h3>
            <p className="text-green-700">
              {Object.entries(analytics.sessions_by_location).length > 0
                ? (() => {
                    const favorite = Object.entries(analytics.sessions_by_location)
                      .sort(([, a], [, b]) => b - a)[0];
                    return `${favorite[0]} with ${favorite[1]} sessions`;
                  })()
                : 'No location data available'
              }
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Most Used Equipment</h3>
            <p className="text-purple-700">
              {Object.entries(analytics.equipment_usage).length > 0
                ? (() => {
                    const mostUsed = Object.entries(analytics.equipment_usage)
                      .sort(([, a], [, b]) => b - a)[0];
                    return `${mostUsed[0]} used in ${mostUsed[1]} sessions`;
                  })()
                : 'No equipment usage data available'
              }
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Training Consistency</h3>
            <p className="text-yellow-700">
              {analytics.total_sessions > 0
                ? `Averaging ${(analytics.total_hours / analytics.total_sessions).toFixed(1)} hours per session`
                : 'Start logging sessions to track consistency'
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};