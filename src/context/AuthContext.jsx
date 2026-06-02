import { createContext, useState, useEffect, useContext } from 'react';
import { getProfile } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await getProfile();
        setUser(userData);
      } catch (err) {
        // Если это 401, то getProfile уже сделал редирект на Keycloak
        if (err.message === 'Unauthorized') {
          return;
        }
        setError(err.message || 'Не удалось подключиться к серверу');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const logout = () => {
    window.location.href = 'http://localhost:9090/logout';
  };

  return (
      // Добавлено: передаем loading и error в контекст, чтобы HomePage их видел
      <AuthContext.Provider value={{ user, loading, error, logout, setUser }}>
        {children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
