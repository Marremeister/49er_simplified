// src/presentation/views/equipment/EquipmentListView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEquipment } from '../../../application/hooks/useEquipment';
import { Table, Column } from '../../components/common/Table/Table';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Select } from '../../components/common/Select/Select';
import { Equipment } from '../../../domain/entities/Equipment';
import { formatDate } from '../../../utils/formatters/dateFormatter';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const EquipmentListView: React.FC = () => {
  const navigate = useNavigate();
  const {
    equipment,
    loading,
    error,
    statistics,
    sortEquipment,
    filterActiveOnly,
    retireEquipment,
    reactivateEquipment,
    refreshEquipment,
    getEquipmentNeedingReplacement,
    getOldEquipment,
  } = useEquipment();

  const [filter, setFilter] = useState<'all' | 'active' | 'retired' | 'needsReplacement' | 'old'>('active');
  const [currentSort, setCurrentSort] = useState<{ column: string; order: 'asc' | 'desc' }>({
    column: 'name',
    order: 'asc',
  });

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setCurrentSort({ column, order });
    sortEquipment(column, order);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter as any);
    switch (newFilter) {
      case 'active':
        filterActiveOnly(true);
        break;
      case 'retired':
      case 'all':
        filterActiveOnly(false);
        break;
    }
  };

  const getFilteredEquipment = (): Equipment[] => {
    switch (filter) {
      case 'retired':
        return equipment.filter(e => !e.active);
      case 'needsReplacement':
        return getEquipmentNeedingReplacement();
      case 'old':
        return getOldEquipment();
      default:
        return equipment;
    }
  };

  const handleRetireEquipment = async (e: React.MouseEvent, equipmentId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to retire this equipment?')) {
      try {
        await retireEquipment(equipmentId);
      } catch (error) {
        console.error('Failed to retire equipment:', error);
      }
    }
  };

  const handleReactivateEquipment = async (e: React.MouseEvent, equipmentId: string) => {
    e.stopPropagation();
    try {
      await reactivateEquipment(equipmentId);
    } catch (error) {
      console.error('Failed to reactivate equipment:', error);
    }
  };

  const columns: Column<Equipment>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
    },
    {
      key: 'manufacturer',
      header: 'Manufacturer',
      sortable: true,
    },
    {
      key: 'model',
      header: 'Model',
    },
    {
      key: 'wear',
      header: 'Wear (hours)',
      render: (item) => (
        <span className={item.shouldReplace() ? 'text-red-600 font-semibold' : ''}>
          {item.wear.toFixed(1)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'purchaseDate',
      header: 'Purchase Date',
      render: (item) => item.purchaseDate ? formatDate(item.purchaseDate) : 'N/A',
      sortable: true,
    },
    {
      key: 'ageInDays',
      header: 'Age',
      render: (item) => {
        if (!item.ageInDays) return 'N/A';
        const years = Math.floor(item.ageInDays / 365);
        const days = item.ageInDays % 365;
        return `${years}y ${days}d`;
      },
      sortable: true,
    },
    {
      key: 'active',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {item.active ? 'Active' : 'Retired'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex space-x-2">
          {item.active ? (
            <Button
              size="small"
              variant="secondary"
              onClick={(e) => handleRetireEquipment(e, item.id)}
            >
              Retire
            </Button>
          ) : (
            <Button
              size="small"
              variant="primary"
              onClick={(e) => handleReactivateEquipment(e, item.id)}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filteredEquipment = getFilteredEquipment();

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
        <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
        <div className="flex space-x-4">
          <Button
            variant="ghost"
            onClick={refreshEquipment}
            disabled={loading}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/equipment/new')}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="small">
            <h3 className="text-sm font-medium text-gray-500">Total Equipment</h3>
            <p className="text-2xl font-bold text-gray-900">{statistics.total_equipment}</p>
          </Card>
          <Card padding="small">
            <h3 className="text-sm font-medium text-gray-500">Active</h3>
            <p className="text-2xl font-bold text-green-600">{statistics.active_equipment}</p>
          </Card>
          <Card padding="small">
            <h3 className="text-sm font-medium text-gray-500">Retired</h3>
            <p className="text-2xl font-bold text-gray-600">{statistics.retired_equipment}</p>
          </Card>
          <Card padding="small">
            <h3 className="text-sm font-medium text-gray-500">Needs Replacement</h3>
            <p className="text-2xl font-bold text-red-600">
              {getEquipmentNeedingReplacement().length}
            </p>
          </Card>
        </div>
      )}

      {/* Filter and Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Equipment List</h2>
          <Select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            options={[
              { value: 'all', label: 'All Equipment' },
              { value: 'active', label: 'Active Only' },
              { value: 'retired', label: 'Retired Only' },
              { value: 'needsReplacement', label: 'Needs Replacement' },
              { value: 'old', label: 'Old Equipment (>2 years)' },
            ]}
          />
        </div>

        <Table
          data={filteredEquipment}
          columns={columns}
          onSort={handleSort}
          currentSort={currentSort}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => navigate(`/equipment/${item.id}`)}
          loading={loading}
          emptyMessage="No equipment found"
        />
      </Card>

      {/* Equipment by Type */}
      {statistics && Object.keys(statistics.equipment_by_type).length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Equipment by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statistics.equipment_by_type).map(([type, count]) => (
              <div key={type} className="text-center">
                <p className="text-sm text-gray-600">{type}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

