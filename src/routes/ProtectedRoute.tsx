import { Navigate } from 'react-router-dom';

function getCurrentUser() {
  try {
    const saved = localStorage.getItem('rjchopp_user');

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function getHomeByRole(role: string) {
  if (role === 'DELIVERY') {
    return '/retiradas';
  }

  if (role === 'FINANCE') {
    return '/financeiro';
  }

  return '/';
}

export default function ProtectedRoute({ children, roles }: any) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return children;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getHomeByRole(user.role)} replace />;
  }

  return children;
}
