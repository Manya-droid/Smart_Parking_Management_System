// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { isLoggedIn, getAdmin } from '../utils/authStorage';

export default function ProtectedRoute({ children, roles }) {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  const role = getAdmin()?.role;
  if (roles && !roles.includes(role)) {
    // logged in, but this role may not open this page
    return <Navigate to={role === 'staff' ? '/checkin' : '/'} replace />;
  }

  return children;
}