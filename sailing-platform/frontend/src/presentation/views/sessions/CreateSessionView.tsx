// src/presentation/views/sessions/CreateSessionView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSessions } from '../../../application/hooks/useSessions';
import { useEquipment } from '../../../application/hooks/useEquipment';
import { Card } from '../../components/common/Card/Card';
import { Input } from '../../components/common/Input/Input';
import { Select } from '../../components/common/Select/Select';
import { Button } from '../../components/common/Button/Button';
import { CreateSessionDTO } from '../../../application/dto/SessionDTO';
import { WAVE_TYPES } from '../../../utils/constants/waveTypes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const createSessionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(1, 'Location is required').max(255, 'Location is too long'),
  wind_speed_min: z.number().min(0, 'Wind speed cannot be negative').max(60, 'Wind speed too high'),
  wind_speed_max: z.number().min(0, 'Wind speed cannot be negative').max(60, 'Wind speed too high'),
  wave_type: z.enum(WAVE_TYPES as [string, ...string[]], {
    required_error: 'Wave type is required',
  }),
  wave_direction: z.string().min(1, 'Wave direction is required').max(50, 'Wave direction is too long'),
  hours_on_water: z.number().min(0.1, 'Hours must be greater than 0').max(12, 'Hours cannot exceed 12'),
  performance_rating: z.number().min(1).max(5),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  equipment_ids: z.array(z.string()).optional(),
  add_settings_after: z.boolean().optional(),
}).refine((data) => data.wind_speed_min <= data.wind_speed_max, {
  message: 'Minimum wind speed cannot exceed maximum',
  path: ['wind_speed_min'],
});

type FormData = z.infer<typeof createSessionSchema>;

export const CreateSessionView: React.FC = () => {
  const navigate = useNavigate();
  const { createSession } = useSessions();
  const { equipment } = useEquipment();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeEquipment = equipment.filter(e => e.active);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      location: '',
      wind_speed_min: 10,
      wind_speed_max: 15,
      wave_type: undefined,
      wave_direction: 'N',
      hours_on_water: 3,
      performance_rating: 3,
      notes: '',
      equipment_ids: [],
      add_settings_after: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const dto: CreateSessionDTO = {
        ...data,
        notes: data.notes || undefined,
        equipment_ids: data.equipment_ids || [],
      };

      const newSession = await createSession(dto);

      // Navigate based on user preference
      if (data.add_settings_after && data.equipment_ids && data.equipment_ids.length > 0) {
        navigate(`/sessions/${newSession.id}/settings`);
      } else {
        navigate(`/sessions/${newSession.id}`);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const performanceRating = watch('performance_rating');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/sessions')}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Log New Session</h1>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {submitError}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Two-Step Process
            </h4>
            <p className="text-sm text-blue-700">
              1. Create your session with basic info and equipment used<br/>
              2. Add detailed rig settings (tensions, sail controls) in the next step
            </p>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Session Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    label="Date"
                    error={errors.date?.message}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                )}
              />

              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Location"
                    error={errors.location?.message}
                    placeholder="e.g., San Francisco Bay"
                    required
                  />
                )}
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Controller
                name="wind_speed_min"
                control={control}
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Min Wind (kts)"
                    error={errors.wind_speed_min?.message}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    step="0.1"
                    required
                  />
                )}
              />

              <Controller
                name="wind_speed_max"
                control={control}
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Max Wind (kts)"
                    error={errors.wind_speed_max?.message}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    step="0.1"
                    required
                  />
                )}
              />

              <Controller
                name="wave_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Wave Type"
                    error={errors.wave_type?.message}
                    options={WAVE_TYPES.map(type => ({ value: type, label: type }))}
                    placeholder="Select wave type"
                    required
                  />
                )}
              />

              <Controller
                name="wave_direction"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Wave Direction"
                    error={errors.wave_direction?.message}
                    placeholder="e.g., NW"
                    required
                  />
                )}
              />
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="hours_on_water"
                control={control}
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Hours on Water"
                    error={errors.hours_on_water?.message}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    step="0.1"
                    required
                  />
                )}
              />

              <Controller
                name="performance_rating"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Performance Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={value}
                        onChange={(e) => onChange(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <div className="flex items-center space-x-1">
                        <span className="text-2xl">
                          {'⭐'.repeat(performanceRating)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({performanceRating}/5)
                        </span>
                      </div>
                    </div>
                    {errors.performance_rating && (
                      <p className="mt-1 text-sm text-red-600">{errors.performance_rating.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Equipment */}
          {activeEquipment.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Equipment Used</h3>
              <Controller
                name="equipment_ids"
                control={control}
                render={({ field: { value, onChange } }) => {
                  // Group equipment by type
                  const equipmentByType = activeEquipment.reduce((acc, item) => {
                    const type = item.type;
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(item);
                    return acc;
                  }, {} as Record<string, typeof activeEquipment>);

                  return (
                    <div className="space-y-4">
                      {Object.entries(equipmentByType).map(([type, items]) => (
                        <div key={type} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">{type}</h4>
                          <div className="ml-4 space-y-2">
                            {items.map((item) => (
                              <label key={item.id} className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  checked={value?.includes(item.id) || false}
                                  onChange={(e) => {
                                    const updatedIds = e.target.checked
                                      ? [...(value || []), item.id]
                                      : (value || []).filter(id => id !== item.id);
                                    onChange(updatedIds);
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {item.manufacturer} {item.model} • {item.wear.toFixed(1)}h wear
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <p className="text-sm text-gray-500 italic">
                Equipment wear hours will be automatically updated based on session duration
              </p>

              {/* Add Settings Option */}
              <Controller
                name="add_settings_after"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <label className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100">
                    <input
                      type="checkbox"
                      checked={value || false}
                      onChange={(e) => onChange(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Add equipment settings after creating session
                      </p>
                      <p className="text-xs text-blue-700">
                        Record detailed rig tensions and sail controls for this session
                      </p>
                    </div>
                  </label>
                )}
              />
            </div>
          )}

          {/* Notes */}
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...field}
                  rows={4}
                  className={`
                    block w-full px-3 py-2 border rounded-md shadow-sm
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    ${errors.notes ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="Add any additional notes about this session..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/sessions')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Session
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};