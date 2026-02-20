// Main application component with routing

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Placeholder screens (will be implemented in later phases)
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import EntryScanScreen from '@/screens/EntryScanScreen';
import ExitScanScreen from '@/screens/ExitScanScreen';
import DiscrepancyScreen from '@/screens/DiscrepancyScreen';
import BackOfHouseScreen from '@/screens/BackOfHouseScreen';
import ManagerDashboardScreen from '@/screens/ManagerDashboardScreen';
import AdminScreen from '@/screens/AdminScreen';

// Protected route wrapper
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Array<'team_member' | 'manager' | 'admin'> }) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginScreen />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entry"
        element={
          <ProtectedRoute>
            <EntryScanScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exit"
        element={
          <ProtectedRoute>
            <ExitScanScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exit/:sessionId"
        element={
          <ProtectedRoute>
            <ExitScanScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discrepancy/:sessionId"
        element={
          <ProtectedRoute>
            <DiscrepancyScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/back-of-house"
        element={
          <ProtectedRoute>
            <BackOfHouseScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['manager', 'admin']}>
            <ManagerDashboardScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminScreen />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
