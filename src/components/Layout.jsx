import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { getCurrencyRates, getMyAccounts } from '../api';
import NotificationBell from './NotificationBell';

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
  { to: '/cashback', icon: '✨', label: 'Кешбэк' },
  { to: '/history', icon: '📊', label: 'История' },
  { to: '/admin', icon: '⚙️', label: 'Админ' },
];

const appShellStyle = isHomePage => ({
  display: 'flex',
  minHeight: '100vh',
  position: 'relative',
  zIndex: 1,
  overflow: 'hidden',
  background: isHomePage
    ? '#252932'
    : 'linear-gradient(135deg, #EEF1F5 0%, #F7F3FB 48%, #E9EEF5 100%)',
});

const homeBackgroundOverlayStyle = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  background: 'radial-gradient(circle at 18% 12%, rgba(118,126,140,0.34), transparent 34%), radial-gradient(circle at 82% 24%, rgba(78,84,96,0.3), transparent 32%), linear-gradient(135deg, #3E444F 0%, #2B3039 42%, #20242C 100%)',
  pointerEvents: 'none',
  zIndex: 0,
};

const animatedBackdropStyle = isHomePage => ({
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
  background: isHomePage
    ? 'linear-gradient(180deg, rgba(255,255,255,0.055), transparent 46%)'
    : 'linear-gradient(120deg, rgba(255,255,255,0.55), rgba(168,85,247,0.08), rgba(110,231,183,0.09))',
  backgroundSize: '220% 220%',
  animation: isHomePage ? 'none' : 'gradientShift 12s ease infinite',
});

const animatedOrbStyle = (top, left, color, animation) => ({
  position: 'fixed',
  top,
  left,
  width: '360px',
  height: '360px',
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color}32 0%, ${color}16 34%, transparent 68%)`,
  filter: 'blur(18px)',
  opacity: 0.8,
  animation,
  pointerEvents: 'none',
  zIndex: 0,
});

const sidebarStyle = isHomePage => ({
  width: '260px',
  background: isHomePage ? 'rgba(49,54,66,0.96)' : 'rgba(251,247,255,0.86)',
  backdropFilter: 'blur(24px)',
  borderRight: isHomePage ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(229,231,235,0.9)',
  boxShadow: isHomePage ? '18px 0 36px rgba(0,0,0,0.16)' : '18px 0 45px rgba(91,63,141,0.08)',
  padding: '2rem 0',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  zIndex: 100,
});

const logoLinkStyle = isHomePage => ({
  color: isHomePage ? '#F4F7FB' : '#1F2937',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
});

const logoIconStyle = isHomePage => ({
  width: '42px',
  height: '42px',
  background: isHomePage
    ? 'linear-gradient(135deg, #6B7280, #D1D5DB)'
    : 'linear-gradient(135deg, #A855F7, #C084FC, #6EE7B7)',
  backgroundSize: '200% 200%',
  animation: isHomePage ? 'none' : 'gradientShift 4s ease infinite',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.3rem',
  color: '#fff',
  boxShadow: isHomePage
    ? '0 14px 24px rgba(0,0,0,0.18)'
    : '0 16px 28px rgba(168,85,247,0.28)',
});

const logoTextStyle = isHomePage => ({
  fontSize: '1.15rem',
  fontWeight: 800,
  letterSpacing: 0,
  color: isHomePage ? '#F4F7FB' : '#1F2937',
});

const activeNavDotStyle = {
  marginLeft: 'auto',
  width: '6px',
  height: '6px',
  background: '#fff',
  borderRadius: '50%',
  boxShadow: '0 0 10px rgba(255,255,255,0.8)',
};

const headerStyle = isHomePage => ({
  position: 'fixed',
  top: '1.25rem',
  left: '282px',
  right: '1.5rem',
  height: '76px',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1.5rem',
  padding: '0 1.5rem',
  background: isHomePage ? 'rgba(49,54,66,0.92)' : 'rgba(255,255,255,0.84)',
  backdropFilter: 'blur(24px)',
  border: isHomePage ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(229,231,235,0.95)',
  borderRadius: '18px',
  boxShadow: isHomePage ? '0 14px 30px rgba(0,0,0,0.16)' : '0 18px 44px rgba(31,41,55,0.08)',
});

const headerLabelStyle = isHomePage => ({
  color: isHomePage ? 'rgba(244,247,251,0.52)' : '#8B8FA3',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: 0,
});

const headerDividerStyle = isHomePage => ({
  width: '1px',
  height: '34px',
  margin: '0 0.25rem',
  background: isHomePage ? 'rgba(255,255,255,0.08)' : 'rgba(31,41,55,0.08)',
});

const profileButtonStyle = isHomePage => ({
  width: '42px',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
  background: isHomePage
    ? 'linear-gradient(135deg, #6B7280, #D1D5DB)'
    : 'linear-gradient(135deg, #A855F7, #C084FC)',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
  boxShadow: isHomePage
    ? '0 12px 24px rgba(0,0,0,0.16)'
    : '0 12px 26px rgba(168,85,247,0.24)',
});

const mainStyle = user => ({
  marginLeft: user ? '260px' : 0,
  flex: 1,
  padding: user ? '118px 2rem 2rem' : '2rem',
  minHeight: '100vh',
  position: 'relative',
  zIndex: 1,
});

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

  const isHomePage = location.pathname === '/home';

  return (
    <div style={appShellStyle(isHomePage)}>
      {isHomePage && (
        <>
          <div style={homeBackgroundOverlayStyle} />
        </>
      )}
      <div style={animatedBackdropStyle(isHomePage)} />
      {!isHomePage && (
        <>
          <div style={animatedOrbStyle('12%', '72%', '#A855F7', 'float 9s ease-in-out infinite')} />
          <div style={animatedOrbStyle('72%', '8%', '#6EE7B7', 'float 11s ease-in-out infinite reverse')} />
          <div style={animatedOrbStyle('48%', '48%', '#C084FC', 'float 13s ease-in-out infinite')} />
        </>
      )}

      <aside style={sidebarStyle(isHomePage)}>
          {/* Логотип */}
          <div style={{ padding: '0 1.5rem', marginBottom: '2.5rem' }}>
            <Link to="/home" style={logoLinkStyle(isHomePage)}>
              <div style={logoIconStyle(isHomePage)}>✦</div>
              <span style={logoTextStyle(isHomePage)}>
                Pay<span style={{ color: isHomePage ? '#D1D5DB' : '#A855F7' }}>Flow</span>
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
                  color: isActive ? '#fff' : isHomePage ? 'rgba(226,232,240,0.58)' : '#8B8FA3',
                  textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 400,
                  background: isActive
                    ? isHomePage
                      ? 'rgba(255,255,255,0.1)'
                      : 'linear-gradient(135deg, #A855F7, #8B5CF6)'
                    : 'transparent',
                  borderRadius: '14px',
                  border: isActive
                    ? isHomePage
                      ? '1px solid rgba(255,255,255,0.12)'
                      : '1px solid rgba(34,211,238,0.22)'
                    : '1px solid transparent',
                  transition: 'all 0.3s',
                  boxShadow: isActive && !isHomePage ? '0 12px 26px rgba(34,211,238,0.22)' : 'none',
                }}>
                  <span style={{ fontSize: '1.1rem', opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <span style={activeNavDotStyle} />}
                </Link>
              );
            })}
          </nav>

        </aside>

      {user && (
        <header style={headerStyle(isHomePage)}>
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
                color: isHomePage ? '#E5F7FF' : '#1F2937',
                cursor: balanceLoading ? 'wait' : 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={headerLabelStyle(isHomePage)}>
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
            <div style={rateStyle(isHomePage)}>
              <CurrencyFlag currency="USD" />
              <span style={rateLabelStyle(isHomePage)}>USD</span>
              <strong>{rates?.USD ? formatMoney(rates.USD) : '—'}</strong>
            </div>
            <div style={rateStyle(isHomePage)}>
              <CurrencyFlag currency="CNY" />
              <span style={rateLabelStyle(isHomePage)}>CNY</span>
              <strong>{rates?.CNY ? formatMoney(rates.CNY) : '—'}</strong>
            </div>
            <div style={headerDividerStyle(isHomePage)} />
            <NotificationBell />
            <Link
              to="/profile"
              title="Профиль"
              style={profileButtonStyle(isHomePage)}
            >
              {(user.firstName || user.preferred_username || 'U')[0].toUpperCase()}
            </Link>
            <button type="button" onClick={handleLogout} style={logoutButtonStyle(isHomePage)}>
              Выйти
            </button>
          </div>
        </header>
      )}

      <main style={mainStyle(user)}>
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

const logoutButtonStyle = isHomePage => ({
  padding: '0.65rem 1rem',
  border: isHomePage ? '1px solid rgba(244,63,94,0.24)' : '1px solid rgba(244,63,94,0.16)',
  borderRadius: '14px',
  background: isHomePage ? 'rgba(244,63,94,0.12)' : 'rgba(244,63,94,0.08)',
  color: isHomePage ? '#FDA4AF' : '#E11D48',
  cursor: 'pointer',
  fontWeight: 700,
});

const flagStyle = {
  width: '24px',
  height: '16px',
  flexShrink: 0,
  borderRadius: '3px',
  boxShadow: '0 0 0 1px rgba(31,41,55,0.12)',
};

const balanceGradientStyle = {
  display: 'block',
  marginTop: '0.2rem',
  fontSize: '1.15rem',
  background: 'linear-gradient(120deg, #86EFAC, #22C55E)',
  backgroundSize: '250% 250%',
  animation: 'gradientShift 4s ease infinite',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const rateStyle = isHomePage => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  padding: '0.5rem 0.7rem',
  border: isHomePage ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(229,231,235,0.95)',
  borderRadius: '14px',
  background: isHomePage ? 'rgba(62,68,80,0.82)' : 'rgba(255,255,255,0.72)',
  fontSize: '0.82rem',
  color: isHomePage ? '#F4F7FB' : '#1F2937',
});

const rateLabelStyle = isHomePage => ({
  color: isHomePage ? 'rgba(226,232,240,0.52)' : '#8B8FA3',
  fontSize: '0.72rem',
});
