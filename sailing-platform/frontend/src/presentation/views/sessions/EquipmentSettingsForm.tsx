// src/presentation/views/sessions/EquipmentSettingsForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SessionService } from '../../../domain/services/SessionService';
import { Card } from '../../components/common/Card/Card';
import { Input } from '../../components/common/Input/Input';
import { Select } from '../../components/common/Select/Select';
import { Button } from '../../components/common/Button/Button';
import { CreateEquipmentSettingsDTO } from '../../../application/dto/SessionDTO';
import { TENSION_LEVELS } from '../../../utils/constants/waveTypes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const equipmentSettingsSchema = z.object({
  // Rig tensions
  forestay_tension: z.number().min(0).max(10),
  shroud_tension: z.number().min(0).max(10),
  mast_rake: z.number().min(-5).max(30),
  main_tension: z.number().min(0).max(10).optional(),
  cap_tension: z.number().min(0).max(10).optional(),
  cap_hole: z.number().min(0).optional(),
  lowers_scale: z.number().min(0).max(10).optional(),
  mains_scale: z.number().min(0).max(10).optional(),
  pre_bend: z.number().min(-50).max(200).optional(),

  // Sail controls
  jib_halyard_tension: z.enum(TENSION_LEVELS as [string, ...string[]]),
  cunningham: z.number().min(0).max(10),
  outhaul: z.number().min(0).max(10),
  vang: z.number().min(0).max(10),
});

type FormData = z.infer<typeof equipmentSettingsSchema>;

export const EquipmentSettingsForm: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ location: string; date: string } | null>(null);

  const sessionService = new SessionService();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(equipmentSettingsSchema),
    defaultValues: {
      forestay_tension: 5,
      shroud_tension: 5,
      mast_rake: 0,
      main_tension: 0,
      cap_tension: 0,
      cap_hole: 0,
      lowers_scale: 0,
      mains_scale: 0,
      pre_bend: 0,
      jib_halyard_tension: 'Medium',
      cunningham: 5,
      outhaul: 5,
      vang: 5,
    },
  });

  useEffect(() => {
    if (sessionId) {
      loadSessionInfo();
    }
  }, [sessionId]);

  const loadSessionInfo = async () => {
    if (!sessionId) return;

    try {
      const session = await sessionService.getSessionById(sessionId);
      if (session) {
        setSessionInfo({
          location: session.location,
          date: session.date,
        });
      }
    } catch (error) {
      console.error('Failed to load session info:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!sessionId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const dto: CreateEquipmentSettingsDTO = {
        forestay_tension: data.forestay_tension,
        shroud_tension: data.shroud_tension,
        mast_rake: data.mast_rake,
        main_tension: data.main_tension || 0,
        cap_tension: data.cap_tension || 0,
        cap_hole: data.cap_hole || 0,
        lowers_scale: data.lowers_scale || 0,
        mains_scale: data.mains_scale || 0,
        pre_bend: data.pre_bend || 0,
        jib_halyard_tension: data.jib_halyard_tension,
        cunningham: data.cunningham,
        outhaul: data.outhaul,
        vang: data.vang,
      };

      await sessionService.createEquipmentSettings(sessionId, dto);
      navigate(`/sessions/${sessionId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RangeInput: React.FC<{
    name: keyof FormData;
    label: string;
    helperText?: string;
    showAdvanced?: boolean;
  }> = ({ name, label, helperText, showAdvanced = true }) => {
    const value = watch(name as any) || 0;
    const showField = showAdvanced ? watch('main_tension') as number > 0 : true;

    if (!showField && !['forestay_tension', 'shroud_tension', 'mast_rake', 'cunningham', 'outhaul', 'vang'].includes(name)) {
      return null;
    }

    return (
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
              {helperText && (
                <span className="text-xs text-gray-500 ml-2">({helperText})</span>
              )}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={name === 'mast_rake' ? -5 : name === 'pre_bend' ? -50 : 0}
                max={name === 'mast_rake' ? 30 : name === 'pre_bend' ? 200 : 10}
                step={name === 'pre_bend' ? 10 : 0.5}
                value={value as number || 0}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="flex-1"
              />
              <div className="w-16 text-right">
                <span className="text-lg font-medium">{value}</span>
                <span className="text-sm text-gray-500 ml-1">
                  {name === 'mast_rake' ? '°' : name === 'pre_bend' ? 'mm' : '/10'}
                </span>
              </div>
            </div>
            {errors[name] && (
              <p className="mt-1 text-sm text-red-600">{errors[name]?.message}</p>
            )}
          </div>
        )}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/sessions/${sessionId}`)}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Settings</h1>
          {sessionInfo && (
            <p className="text-gray-600 mt-1">
              {sessionInfo.location} • {new Date(sessionInfo.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {submitError}
          </div>
        )}

        {/* Basic Rig Settings */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Basic Rig Settings</h2>
          <div className="space-y-6">
            <RangeInput
              name="forestay_tension"
              label="Forestay Tension"
              helperText="0=loose, 10=tight"
            />
            <RangeInput
              name="shroud_tension"
              label="Shroud Tension"
              helperText="Lower tension"
            />
            <RangeInput
              name="mast_rake"
              label="Mast Rake"
              helperText="degrees"
            />
          </div>
        </Card>

        {/* Advanced Rig Settings */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Advanced Rig Settings</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set Main Tension to enable advanced measurements
          </p>
          <div className="space-y-6">
            <RangeInput
              name="main_tension"
              label="Main Tension"
              helperText="Enable to show advanced settings"
            />
            <RangeInput
              name="cap_tension"
              label="Cap Tension"
              showAdvanced
            />
            <Controller
              name="cap_hole"
              control={control}
              render={({ field: { onChange, value } }) => (
                watch('main_tension') as number > 0 ? (
                  <div>
                    <Input
                      type="number"
                      label="Cap Hole"
                      value={value || ''}
                      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={1}
                      helperText="Hole number or measurement"
                    />
                  </div>
                ) : null
              )}
            />
            <RangeInput
              name="lowers_scale"
              label="Lowers Scale"
              showAdvanced
            />
            <RangeInput
              name="mains_scale"
              label="Mains Scale"
              showAdvanced
            />
            <RangeInput
              name="pre_bend"
              label="Pre-bend"
              helperText="mm"
              showAdvanced
            />
          </div>
        </Card>

        {/* Sail Controls */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Sail Controls</h2>
          <div className="space-y-6">
            <Controller
              name="jib_halyard_tension"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Jib Halyard Tension"
                  options={TENSION_LEVELS.map(level => ({ value: level, label: level }))}
                  error={errors.jib_halyard_tension?.message}
                />
              )}
            />
            <RangeInput
              name="cunningham"
              label="Cunningham"
              helperText="0=off, 10=max"
            />
            <RangeInput
              name="outhaul"
              label="Outhaul"
              helperText="0=loose, 10=tight"
            />
            <RangeInput
              name="vang"
              label="Vang/Kicker"
              helperText="0=off, 10=max"
            />
          </div>
        </Card>

        {/* Quick Presets */}
        <Card>
          <h3 className="font-semibold mb-4">Quick Presets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                // Light weather preset
                setValue('forestay_tension', 3);
                setValue('shroud_tension', 3);
                setValue('main_tension', 2);
                setValue('jib_halyard_tension', 'Loose');
                setValue('cunningham', 2);
                setValue('outhaul', 3);
                setValue('vang', 2);
              }}
            >
              Light Weather
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                // Medium weather preset
                setValue('forestay_tension', 5);
                setValue('shroud_tension', 5);
                setValue('main_tension', 5);
                setValue('jib_halyard_tension', 'Medium');
                setValue('cunningham', 5);
                setValue('outhaul', 5);
                setValue('vang', 5);
              }}
            >
              Medium Weather
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                // Heavy weather preset
                setValue('forestay_tension', 8);
                setValue('shroud_tension', 7);
                setValue('main_tension', 7);
                setValue('jib_halyard_tension', 'Tight');
                setValue('cunningham', 8);
                setValue('outhaul', 8);
                setValue('vang', 8);
              }}
            >
              Heavy Weather
            </Button>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/sessions/${sessionId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};