import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout, getProfile } from '../api';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getProfile()
      .then(data => setProfile(data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = async () => {
    logout();
  };

  const navItems = [
    { path: '/', label: 'Главная', icon: '🏠' },
    { path: '/profile', label: 'Профиль', icon: '👤' },
    { path: '/cards', label: 'Карты', icon: '💳' },
    { path: '/transfers', label: 'Переводы', icon: '🔄' },
    { path: '/payments', label: 'Платежи', icon: '📋' },
    { path: '/replenishments', label: 'Пополнения', icon: '💰' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#1a1a2e',
        color: 'white',
        padding: '0 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
        }}>
          <Link to="/" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>
            💳 PS Payment
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
            className="menu-toggle"
          >
            ☰
          </button>

          <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  color: isActive(item.path) ? '#1a73e8' : 'rgba(255,255,255,0.8)',
                  background: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {profile && (
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                {profile.firstName} {profile.lastName}
              </span>
            )}
            <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <div className="container">
          {children}
        </div>
      </main>

      <footer style={{
        background: '#1a1a2e',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        padding: '16px',
        fontSize: '0.8rem',
      }}>
        © 2026 PS Payment System. All rights reserved.
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .menu-toggle { display: block !important; }
          header nav { display: ${menuOpen ? 'flex' : 'none'} !important; flex-direction: column; position: absolute; top: 60px; left: 0; right: 0; background: #1a1a2e; padding: 12px; }
        }
      `}</style>
    </div>
  );
}