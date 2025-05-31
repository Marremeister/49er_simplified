// src/App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './application/context/AuthContext';
import { AppRouter } from './presentation/routes/AppRouter';
import './presentation/styles/globals.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
};

// src/presentation/routes/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../application/hooks/useAuth';
import { PrivateRoute } from './PrivateRoute';
import { AuthLayout } from '../components/layout/AuthLayout/AuthLayout';
import { AppLayout } from '../components/layout/AppLayout/AppLayout';

// Views
import { LoginView } from '../views/auth/LoginView';
import { RegisterView } from '../views/auth/RegisterView';
import { DashboardView } from '../views/dashboard/DashboardView';
import { SessionsListView } from '../views/sessions/SessionsListView';
import { CreateSessionView } from '../views/sessions/CreateSessionView';
import { SessionAnalyticsView } from '../views/sessions/SessionAnalyticsView';
import { EquipmentListView } from '../views/equipment/EquipmentListView';
import { CreateEquipmentView } from '../views/equipment/CreateEquipmentView';

export const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginView />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterView />}
        />
      </Route>

      {/* Private routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardView />} />

          {/* Sessions */}
          <Route path="/sessions" element={<SessionsListView />} />
          <Route path="/sessions/new" element={<CreateSessionView />} />
          <Route path="/sessions/analytics" element={<SessionAnalyticsView />} />

          {/* Equipment */}
          <Route path="/equipment" element={<EquipmentListView />} />
          <Route path="/equipment/new" element={<CreateEquipmentView />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
