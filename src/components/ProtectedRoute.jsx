import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  // Пока проверяем авторизацию — не показываем ничего (или спиннер)
  if (loading) {
    return null;
  }
  
  // Если неавторизован — редирект на логин
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
