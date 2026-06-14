import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Прямой fetch, без CSRF-токена — это просто проверка сессии
    fetch('/api/v1/client/profile', { 
      credentials: 'include',
      headers: {}
    })
      .then(async res => {
        console.log('[Auth] статус:', res.status);
        console.log('[Auth] куки:', document.cookie);
        if (res.status === 401) {
          setUser(null);
          setLoading(false);
          return null;
        }
        const data = await res.json();
        console.log('[Auth] данные:', data);
        return data;
      })
      .then(data => {
        if (data) {
          setUser(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[Auth] ошибка:', err);
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = () => {
    window.location.href = 'http://localhost:9090/oauth2/authorization/keycloak';
  };

  const register = () => {
    window.location.href = 'http://localhost:9090/oauth2/authorization/keycloak?action=register';
  };

  const logout = () => {
    window.location.href = 'http://localhost:9090/logout';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
