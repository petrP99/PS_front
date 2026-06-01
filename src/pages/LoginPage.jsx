import { loginWithKeycloak } from '../api';
import { useEffect, useState } from 'react';
import { getProfile } from '../api';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getProfile()
      .then(() => navigate('/'))
      .catch(() => setChecking(false));
  }, [navigate]);

  if (checking) {
    return <div className="loading">Проверка авторизации...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      <div className="card" style={{ width: 400, maxWidth: '90vw', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>💳</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8, color: '#1a1a2e' }}>Платёжная система</h1>
        <p style={{ color: '#666', marginBottom: 24, fontSize: '0.9rem' }}>
          Войдите в систему для управления картами, переводами и платежами
        </p>
        <button onClick={loginWithKeycloak} className="btn" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
          Войти через Keycloak
        </button>

        <div style={{ marginTop: 24, padding: '16px', background: '#f8f9fa', borderRadius: 8, fontSize: '0.8rem', color: '#888' }}>
          <p style={{ marginBottom: 4 }}>Тестовые пользователи:</p>
          <p>1@ps.ru / 123 (USER)</p>
          <p>admin@psproject.com / admin123 (ADMIN)</p>
        </div>
      </div>
    </div>
  );
}