import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { getCurrencyRates, getMyAccounts } from '../api';

const currencies = ['RUB', 'USD', 'CNY'];
const currencySigns = {
  RUB: '₽',
  USD: '$',
  CNY: '¥',
};

const navItems = [
  { to: '/home', icon: '🏠', label: 'Главная' },
  { to: '/cards', icon: '💳', label: 'Карты' },
  { to: '/accounts', icon: '🏦', label: 'Мои счета' },
  { to: '/transfers', icon: '⚡', label: 'Переводы' },
  { to: '/replenishment', icon: '💰', label: 'Пополнения' },
  { to: '/payments', icon: '🧾', label: 'Платежи' },
  { to: '/history', icon: '📊', label: 'История' },
  { to: '/admin', icon: '⚙️', label: 'Админ' },
];

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [accounts, setAccounts] = useState([]);
  const [rates, setRates] = useState(null);
  const [balanceCurrency, setBalanceCurrency] = useState('RUB');
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    if (!user) return undefined;

    const fetchNavbarData = async () => {
      setBalanceLoading(true);
      try {
        const [accountsData, ratesData] = await Promise.all([
          getMyAccounts(),
          getCurrencyRates(),
        ]);
        setAccounts(accountsData);
        setRates(ratesData);
      } catch (error) {
        console.error('Ошибка загрузки данных navbar:', error);
        setRates(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchNavbarData();
    return undefined;
  }, [location.pathname, user]);

  const totalBalance = rates
    ? accounts.reduce((totalRub, account) => {
        const rate = Number(rates[account.currency]);
        return totalRub + Number(account.balance || 0) * rate;
      }, 0) / Number(rates[balanceCurrency])
    : null;

  const switchBalanceCurrency = () => {
    setBalanceCurrency(currentCurrency => {
      const currentIndex = currencies.indexOf(currentCurrency);
      return currencies[(currentIndex + 1) % currencies.length];
    });
  };

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

        </aside>

      {user && (
        <header style={{
          position: 'fixed',
          top: 0,
          left: '260px',
          right: 0,
          height: '76px',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          padding: '0 2rem',
          background: 'rgba(15,15,25,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              type="button"
              onClick={switchBalanceCurrency}
              title="Нажмите, чтобы изменить валюту баланса"
              disabled={balanceLoading || !Number.isFinite(totalBalance)}
              style={{
                padding: 0,
                border: 0,
                background: 'transparent',
                color: '#fff',
                cursor: balanceLoading ? 'wait' : 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Общий баланс
              </div>
              <strong style={balanceGradientStyle}>
                {balanceLoading
                  ? 'Загрузка...'
                  : Number.isFinite(totalBalance)
                    ? `${formatMoney(totalBalance)} ${currencySigns[balanceCurrency]}`
                    : 'Недоступен'}
              </strong>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={rateStyle}>
              <CurrencyFlag currency="USD" />
              <span style={rateLabelStyle}>USD</span>
              <strong>{rates?.USD ? formatMoney(rates.USD) : '—'}</strong>
            </div>
            <div style={rateStyle}>
              <CurrencyFlag currency="CNY" />
              <span style={rateLabelStyle}>CNY</span>
              <strong>{rates?.CNY ? formatMoney(rates.CNY) : '—'}</strong>
            </div>
            <div style={{ width: '1px', height: '34px', margin: '0 0.25rem', background: 'rgba(255,255,255,0.08)' }} />
            <Link
              to="/profile"
              title="Профиль"
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #c084fc)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              {(user.firstName || user.preferred_username || 'U')[0].toUpperCase()}
            </Link>
            <button type="button" onClick={handleLogout} style={logoutButtonStyle}>
              Выйти
            </button>
          </div>
        </header>
      )}

      <main style={{
        marginLeft: user ? '260px' : 0,
        flex: 1,
        padding: user ? '108px 2rem 2rem' : '2rem',
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

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CurrencyFlag({ currency }) {
  if (currency === 'USD') {
    return (
      <svg viewBox="0 0 24 16" aria-label="Флаг США" style={flagStyle}>
        <rect width="24" height="16" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12, 14].map(y => (
          <rect key={y} y={y} width="24" height="1" fill="#dc2626" />
        ))}
        <rect width="10" height="8" fill="#1d4ed8" />
        <g fill="#fff">
          <circle cx="2" cy="2" r="0.6" />
          <circle cx="5" cy="2" r="0.6" />
          <circle cx="8" cy="2" r="0.6" />
          <circle cx="3.5" cy="4" r="0.6" />
          <circle cx="6.5" cy="4" r="0.6" />
          <circle cx="2" cy="6" r="0.6" />
          <circle cx="5" cy="6" r="0.6" />
          <circle cx="8" cy="6" r="0.6" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 16" aria-label="Флаг Китая" style={flagStyle}>
      <rect width="24" height="16" fill="#dc2626" />
      <polygon points="5,2 5.7,4 7.8,4 6.1,5.2 6.8,7.2 5,6 3.2,7.2 3.9,5.2 2.2,4 4.3,4" fill="#facc15" />
    </svg>
  );
}

const logoutButtonStyle = {
  padding: '0.65rem 1rem',
  border: '1px solid rgba(244,63,94,0.28)',
  borderRadius: '10px',
  background: 'rgba(244,63,94,0.1)',
  color: '#fda4af',
  cursor: 'pointer',
  fontWeight: 600,
};

const flagStyle = {
  width: '24px',
  height: '16px',
  flexShrink: 0,
  borderRadius: '3px',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.16)',
};

const balanceGradientStyle = {
  display: 'block',
  marginTop: '0.2rem',
  fontSize: '1.15rem',
  background: 'linear-gradient(120deg, #22c55e, #86efac, #10b981, #bbf7d0)',
  backgroundSize: '250% 250%',
  animation: 'gradientShift 4s ease infinite',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const rateStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  padding: '0.5rem 0.7rem',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.035)',
  fontSize: '0.82rem',
};

const rateLabelStyle = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: '0.72rem',
};
