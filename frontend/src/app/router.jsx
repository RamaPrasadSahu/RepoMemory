import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import LoadingState from '../components/common/LoadingState';

// Lazy loaded page components
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const RepositoriesPage = lazy(() => import('../pages/RepositoriesPage'));
const RepositoryDetailPage = lazy(() => import('../pages/RepositoryDetailPage'));
const PullRequestsPage = lazy(() => import('../pages/PullRequestsPage'));
const AnalysisPage = lazy(() => import('../pages/AnalysisPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const QAPage = lazy(() => import('../pages/QAPage'));
const MemoryPage = lazy(() => import('../pages/MemoryPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const SuspenseWrapper = ({ children }) => (
  <Suspense
    fallback={
      <LoadingState
        message="Loading workspace module..."
        subtext="Preparing engineering view"
      />
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <LandingPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/register',
    element: (
      <SuspenseWrapper>
        <RegisterPage />
      </SuspenseWrapper>
    ),
  },

  // Protected Application Routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/repositories',
        element: (
          <SuspenseWrapper>
            <RepositoriesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/repositories/:repositoryId',
        element: (
          <SuspenseWrapper>
            <RepositoryDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/qa',
        element: (
          <SuspenseWrapper>
            <QAPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/repositories/:repositoryId/qa',
        element: (
          <SuspenseWrapper>
            <QAPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/memory',
        element: (
          <SuspenseWrapper>
            <MemoryPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/repositories/:repositoryId/memory',
        element: (
          <SuspenseWrapper>
            <MemoryPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/pull-requests',
        element: (
          <SuspenseWrapper>
            <PullRequestsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/analysis/:analysisId',
        element: (
          <SuspenseWrapper>
            <AnalysisPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/history',
        element: (
          <SuspenseWrapper>
            <HistoryPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/settings',
        element: (
          <SuspenseWrapper>
            <SettingsPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  // 404 Fallback
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
]);

export default router;
