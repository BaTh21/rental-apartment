import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import Layout from './Layout';


const ProtectedLayout = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If there are allowedRoles and the user role is missing or not allowed -> redirect
  if (allowedRoles.length > 0) {
    const userRoleName = user.role?.name ?? null;
    if (!userRoleName || !allowedRoles.includes(userRoleName)) {
      return <Navigate to="/" replace />;
    }
  }

  // Render the app layout wrapping the children (Layout contains <Outlet /> so it's fine)
  return <Layout>{children}</Layout>;
};

export default ProtectedLayout;
