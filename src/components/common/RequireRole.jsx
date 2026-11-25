import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth.js';

export default function RequireRole({ roles, children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <p className="p4-empty">You do not have access to this page.</p>;
  return children;
}
