import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/home', icon: '🏠', label: 'Главная' },
  { to: '/cards', icon: '💳', label: 'Карты' },
  { to: '/accounts', icon: '🏦', label: 'Мои счета' },
  { to: '/transfers', icon: '⚡', label: 'Переводы' },
  { to: '/payments', icon: '🧾', label: 'Платежи' },
  { to: '/history', icon: '📊', label: 'История' },
  { to: '/admin', icon: '⚙️', label: 'Админ' },
];

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [usdRate, setUsdRate] = useState(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://www.cbr-xml-daily.ru/latest.js');
        const data = await res.json();
        setUsdRate(data.rates?.USD ? (1 / data.rates.USD).toFixed(2) : (await (await fetch('https://api.exchangerate-api.com/v4/latest/USD')).json()).rates?.RUB?.toFixed(2) || '85.50');
      } catch { setUsdRate('85.50'); }
    };
    fetchRate();
    const i = setInterval(fetchRate, 300000);
    return () => clearInterval(i);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    const form = document.createElement('form');
    form.method = 'POST'; form.action = '/logout';
    form.style.display = 'none';
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <aside style={{
          width: '260px',
          background: 'rgba(15,15,25,0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '2rem 0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
        }}>
          {/* Логотип */}
          <div style={{ padding: '0 1.5rem', marginBottom: '2.5rem' }}>
            <Link to="/home" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px', height: '42px',
                background: 'linear-gradient(135deg, #6366f1, #c084fc, #f472b6)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 4s ease infinite',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
                boxShadow: '0 0 20px rgba(99,102,241,0.3)',
              }}>✦</div>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                Pay<span style={{ color: '#818cf8' }}>Flow</span>
              </span>
            </Link>
          </div>

          {/* Навигация */}
          <nav style={{ flex: 1 }}>
            {navItems.map(item => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <Link key={item.to} to={item.to} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.85rem 1.5rem', margin: '0 0.75rem 0.25rem',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                  borderRadius: '12px',
                  border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  transition: 'all 0.3s',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                }}>
                  <span style={{ fontSize: '1.1rem', opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <span style={{ marginLeft: 'auto', width: '6px', height: '6px', background: '#818cf8', borderRadius: '50%', boxShadow: '0 0 10px #818cf8' }} />}
                </Link>
              );
            })}
          </nav>

          {/* Курс и пользователь */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {usdRate && user && (
              <div className="glass" style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', borderRadius: '10px' }}>
                <span>💵</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>USD/RUB</span>
                <strong style={{ marginLeft: 'auto', color: '#818cf8' }}>{usdRate}</strong>
              </div>
            )}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px', height: '36px',
                  background: 'linear-gradient(135deg, #6366f1, #c084fc)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700,
                }}>
                  {user?.preferred_username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.preferred_username}</div>
                </div>
                <button onClick={handleLogout} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)', borderRadius: '8px',
                  padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.7rem',
                  transition: 'all 0.3s',
                }}
                  onMouseOver={e => { e.target.style.background = 'rgba(236,72,153,0.15)'; e.target.style.borderColor = 'rgba(236,72,153,0.3)'; e.target.style.color = '#f472b6'; }}
                  onMouseOut={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.color = 'rgba(255,255,255,0.5)'; }}
                >Выйти</button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} style={{
                width: '100%', padding: '0.7rem 0',
                background: 'linear-gradient(135deg, #6366f1, #c084fc)',
                color: '#fff', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              }}>
                Войти
              </button>
            )}
          </div>
        </aside>

      <main style={{
        marginLeft: user ? '260px' : 0,
        flex: 1,
        padding: '2rem',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
