// src/presentation/components/layout/AppLayout/AppLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};