import { createContext, useState, useEffect, useContext } from 'react';
import { bffUrl } from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(bffUrl('/api/v1/client/profile'), {
      credentials: 'include',
      headers: {}
    })
      .then(async res => {
        if (res.status === 401) {
          setUser(null);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setUser(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[Auth] profile request failed:', err);
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = () => {
    window.location.href = bffUrl('/oauth2/authorization/keycloak');
  };

  const register = () => {
    window.location.href = bffUrl('/oauth2/authorization/keycloak?action=register');
  };

  const logout = () => {
    window.location.href = bffUrl('/logout');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);