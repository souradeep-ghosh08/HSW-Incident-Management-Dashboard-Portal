import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    navigate('/login', { state: { from: location } });
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    navigate('/unauthorized');
    return null;
  }

  return children;
};

export default ProtectedRoute;
