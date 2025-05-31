// src/presentation/components/layout/Sidebar/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Sessions', href: '/sessions', icon: CalendarIcon },
  { name: 'Analytics', href: '/sessions/analytics', icon: ChartBarIcon },
  { name: 'Equipment', href: '/equipment', icon: WrenchScrewdriverIcon },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="mt-5 px-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};