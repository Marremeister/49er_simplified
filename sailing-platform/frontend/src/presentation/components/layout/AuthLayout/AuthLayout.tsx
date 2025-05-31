import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⛵ Sailing Platform
          </h1>
          <p className="text-gray-600">
            Olympic 49er Campaign Management
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};