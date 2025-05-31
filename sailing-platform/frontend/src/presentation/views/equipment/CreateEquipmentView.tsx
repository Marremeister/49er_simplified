// src/presentation/views/equipment/CreateEquipmentView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEquipment } from '../../../application/hooks/useEquipment';
import { Card } from '../../components/common/Card/Card';
import { Input } from '../../components/common/Input/Input';
import { Select } from '../../components/common/Select/Select';
import { Button } from '../../components/common/Button/Button';
import { CreateEquipmentDTO } from '../../../application/dto/EquipmentDTO';
import { EQUIPMENT_TYPES } from '../../../utils/constants/equipmentTypes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Validation schema
const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  type: z.enum(EQUIPMENT_TYPES as [string, ...string[]], {
    required_error: 'Equipment type is required',
  }),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100, 'Manufacturer is too long'),
  model: z.string().min(1, 'Model is required').max(100, 'Model is too long'),
  purchase_date: z.string().optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

type FormData = z.infer<typeof createEquipmentSchema>;

export const CreateEquipmentView: React.FC = () => {
  const navigate = useNavigate();
  const { createEquipment } = useEquipment();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      name: '',
      type: undefined,
      manufacturer: '',
      model: '',
      purchase_date: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const dto: CreateEquipmentDTO = {
        ...data,
        purchase_date: data.purchase_date || undefined,
        notes: data.notes || undefined,
      };

      await createEquipment(dto);
      navigate('/equipment');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/equipment')}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Equipment</h1>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Equipment Name"
                  error={errors.name?.message}
                  placeholder="e.g., Competition Mainsail"
                  required
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Type"
                  error={errors.type?.message}
                  options={EQUIPMENT_TYPES.map(type => ({ value: type, label: type }))}
                  placeholder="Select equipment type"
                  required
                />
              )}
            />

            <Controller
              name="manufacturer"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Manufacturer"
                  error={errors.manufacturer?.message}
                  placeholder="e.g., North Sails"
                  required
                />
              )}
            />

            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Model"
                  error={errors.model?.message}
                  placeholder="e.g., 3Di RAW 760"
                  required
                />
              )}
            />

            <Controller
              name="purchase_date"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  label="Purchase Date"
                  error={errors.purchase_date?.message}
                  max={new Date().toISOString().split('T')[0]}
                />
              )}
            />
          </div>

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
                  placeholder="Add any additional notes about this equipment..."
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
              onClick={() => navigate('/equipment')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Equipment
            </Button>
          </div>
        </form>
      </Card>

      {/* Tips */}
      <Card padding="small">
        <h3 className="font-semibold text-gray-900 mb-2">Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Give your equipment a descriptive name to easily identify it later</li>
          <li>• The purchase date helps track equipment age and warranty</li>
          <li>• Use notes to record serial numbers, purchase details, or special characteristics</li>
          <li>• Equipment wear will be automatically tracked through your sailing sessions</li>
        </ul>
      </Card>
    </div>
  );
};
