// src/presentation/views/sessions/SessionDetailView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionService } from '../../../domain/services/SessionService';
import { Session } from '../../../domain/entities/Session';
import { EquipmentSettings } from '../../../domain/entities/EquipmentSettings';
import { Equipment } from '../../../domain/entities/Equipment';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { formatDate } from '../../../utils/formatters/dateFormatter';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  CloudIcon,
  ClockIcon,
  StarIcon,
  WrenchScrewdriverIcon,
  PencilIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export const SessionDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [equipmentSettings, setEquipmentSettings] = useState<EquipmentSettings | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionService = new SessionService();

  useEffect(() => {
    if (id) {
      loadSessionDetails();
    }
  }, [id]);

  const loadSessionDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Get session with settings
      const { session: sessionData, settings } = await sessionService.getSessionWithSettings(id);
      setSession(sessionData);
      setEquipmentSettings(settings || null);

      // Get equipment used in this session
      const equipmentData = await sessionService.getSessionEquipment(id);
      setEquipment(equipmentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Session not found'}
        </div>
        <Button className="mt-4" onClick={() => navigate('/sessions')}>
          Back to Sessions
        </Button>
      </div>
    );
  }

  const groupEquipmentByType = (equipment: Equipment[]) => {
    return equipment.reduce((acc, item) => {
      const type = item.type.toLowerCase();
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {} as Record<string, Equipment[]>);
  };

  const equipmentByType = groupEquipmentByType(equipment);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/sessions')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/sessions/${id}/edit`)}
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Session
          </Button>
          <Button
            onClick={() => navigate(`/sessions/${id}/settings${equipmentSettings ? '/edit' : ''}`)}
            variant={equipmentSettings ? "secondary" : "primary"}
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            {equipmentSettings ? 'Edit Settings' : 'Add Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Settings Reminder */}
          {!equipmentSettings && equipment.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Cog6ToothIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-900">
                    Equipment Settings Not Recorded
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Add rig tensions and sail controls to track what settings worked for these conditions.
                  </p>
                  <Button
                    size="small"
                    className="mt-3"
                    onClick={() => navigate(`/sessions/${id}/settings`)}
                  >
                    Add Settings Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Session Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(session.date)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{session.location}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CloudIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Conditions</p>
                  <p className="font-medium">{session.getConditionsSummary()}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{session.hoursOnWater} hours</p>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StarIcon className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Performance Rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {'⭐'.repeat(session.performanceRating)}
                  </span>
                  <span className="text-gray-500">({session.performanceRating}/5)</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}
          </Card>

          {/* Equipment Used */}
          <Card>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <WrenchScrewdriverIcon className="h-6 w-6 mr-2" />
              Equipment Used
            </h2>
            {equipment.length === 0 ? (
              <p className="text-gray-500">No equipment recorded for this session</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(equipmentByType).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="font-medium text-gray-700 capitalize mb-2">{type}</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.manufacturer} {item.model}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Wear</p>
                            <p className="font-medium">{item.wear.toFixed(1)}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Equipment Settings */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Equipment Settings</h2>
              {equipmentSettings && (
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => navigate(`/sessions/${id}/settings/edit`)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!equipmentSettings ? (
              <div className="text-center py-8">
                <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No settings recorded</p>
                <Button
                  size="small"
                  onClick={() => navigate(`/sessions/${id}/settings`)}
                >
                  Add Settings
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Rig Tensions */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Rig Tensions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Forestay</span>
                      <span className="font-medium">{equipmentSettings.forestayTension}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shroud</span>
                      <span className="font-medium">{equipmentSettings.shroudTension}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mast Rake</span>
                      <span className="font-medium">{equipmentSettings.mastRake}°</span>
                    </div>
                    {equipmentSettings.mainTension > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Main Tension</span>
                        <span className="font-medium">{equipmentSettings.mainTension}/10</span>
                      </div>
                    )}
                    {equipmentSettings.capTension > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cap Tension</span>
                        <span className="font-medium">{equipmentSettings.capTension}/10</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sail Controls */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Sail Controls</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jib Halyard</span>
                      <span className="font-medium">{equipmentSettings.jibHalyardTension}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cunningham</span>
                      <span className="font-medium">{equipmentSettings.cunningham}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Outhaul</span>
                      <span className="font-medium">{equipmentSettings.outhaul}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vang</span>
                      <span className="font-medium">{equipmentSettings.vang}/10</span>
                    </div>
                  </div>
                </div>

                {/* Weather Setup Indicator */}
                <div className="pt-4 border-t">
                  {equipmentSettings.isHeavyWeatherSetup && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <CloudIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Heavy Weather Setup</span>
                    </div>
                  )}
                  {equipmentSettings.isLightWeatherSetup && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CloudIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Light Weather Setup</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card>
            <h3 className="font-medium text-gray-700 mb-3">Session Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Wind Range</span>
                <span className="font-medium">{session.windRange} kts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Wind</span>
                <span className="font-medium">{session.averageWindSpeed} kts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Wave Direction</span>
                <span className="font-medium">{session.waveDirection}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};