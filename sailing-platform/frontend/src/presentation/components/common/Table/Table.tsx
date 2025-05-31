// src/presentation/components/common/Table/Table.tsx
import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  currentSort?: { column: string; order: 'asc' | 'desc' };
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  currentSort,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  const handleSort = (column: string) => {
    if (!onSort) return;

    const newOrder =
      currentSort?.column === column && currentSort?.order === 'asc'
        ? 'desc'
        : 'asc';

    onSort(column, newOrder);
  };

  const renderSortIcon = (column: string) => {
    if (currentSort?.column !== column) return null;

    return currentSort.order === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 ml-1 inline" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 ml-1 inline" />
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center">
          <svg
            className="animate-spin h-5 w-5 mr-3 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500
                  uppercase tracking-wider
                  ${column.sortable && onSort ? 'cursor-pointer hover:bg-gray-100' : ''}
                `}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <span className="flex items-center">
                  {column.header}
                  {column.sortable && renderSortIcon(column.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render
                    ? column.render(item)
                    : item[column.key]?.toString() || '-'
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Export Column type for use in other components
export type { Column };