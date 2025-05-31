// src/presentation/components/layout/Header/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../application/hooks/useAuth';
import { Button } from '../../common/Button/Button';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Sailing Platform
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-700">
              <UserCircleIcon className="h-5 w-5 mr-2" />
              {user?.username}
            </div>
            <Button variant="ghost" size="small" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};