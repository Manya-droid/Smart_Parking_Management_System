import { Navigate } from 'react-router-dom';
import { isOwnerLoggedIn } from '../utils/authStorage';

export default function OwnerProtectedRoute({ children }) {
  return isOwnerLoggedIn() ? children : <Navigate to="/owner/login" replace />;
}