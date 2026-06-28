import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from '../components/ProtectedRoute';

const Routes = ({ toggleDarkMode, darkMode }) => {
  return (
    <RouterRoutes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </RouterRoutes>
  );
};

export default Routes;
