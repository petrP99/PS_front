import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCashbackAccruals, getCurrencyRates, getMyAccounts } from '../api';
import tradingBackground from '../assets/home-trading-background.png';

const currencies = ['RUB', 'USD', 'CNY'];
const currencySigns = {
  RUB: '₽',
  USD: '$',
  CNY: '¥',
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [rates, setRates] = useState(null);
  const [balanceCurrency, setBalanceCurrency] = useState('RUB');
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState(false);
  const [cashbackAccruals, setCashbackAccruals] = useState([]);
  const [cashbackLoading, setCashbackLoading] = useState(true);
  const [cashbackError, setCashbackError] = useState(false);
  const [isCashbackHovered, setCashbackHovered] = useState(false);
  const [hoveredQuickAction, setHoveredQuickAction] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const [accountsData, ratesData] = await Promise.all([
          getMyAccounts(),
          getCurrencyRates(),
        ]);
        setAccounts(accountsData);
        setRates(ratesData);
      } catch (error) {
        console.error('Ошибка расчета общего баланса:', error);
        setBalanceError(true);
      } finally {
        setBalanceLoading(false);
      }
    };

    loadBalance();
  }, []);

  useEffect(() => {
    const loadCashback = async () => {
      try {
        const result = await getCashbackAccruals();
        setCashbackAccruals(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error('Ошибка загрузки кешбэка:', error);
        setCashbackError(true);
      } finally {
        setCashbackLoading(false);
      }
    };

    loadCashback();
  }, []);

  const totalBalance = rates
    ? accounts.reduce((totalRub, account) => (
        totalRub + Number(account.balance || 0) * Number(rates[account.currency])
      ), 0) / Number(rates[balanceCurrency])
    : null;

  const currentMonthCashback = useMemo(
    () => calculateCurrentMonthCashback(cashbackAccruals, rates),
    [cashbackAccruals, rates]
  );

  const switchBalanceCurrency = () => {
    setBalanceCurrency(current => {
      const currentIndex = currencies.indexOf(current);
      return currencies[(currentIndex + 1) % currencies.length];
    });
  };

  const features = [
    { icon: '🔄', title: 'Между своими счетами', desc: 'Перевод между счетами', accent: '#fca5a5', bg: 'linear-gradient(135deg, rgba(39,39,42,0.9), rgba(24,24,27,0.96))', hoverBg: 'linear-gradient(135deg, rgba(127,29,29,0.34), rgba(24,24,27,0.98))', glow: 'rgba(239,68,68,0.14)', path: '/transfers/accounts' },
    { icon: '💰', title: 'Пополнения', desc: 'Пополнить счёт', accent: '#86efac', bg: 'linear-gradient(135deg, rgba(39,39,42,0.9), rgba(22,28,25,0.96))', hoverBg: 'linear-gradient(135deg, rgba(22,101,52,0.34), rgba(24,24,27,0.98))', glow: 'rgba(34,197,94,0.14)', path: '/replenishment' },
    { icon: '🧾', title: 'Оплата услуг', desc: 'Телефон, интернет, ЖКХ', accent: '#fecaca', bg: 'linear-gradient(135deg, rgba(38,38,38,0.9), rgba(24,24,27,0.96))', hoverBg: 'linear-gradient(135deg, rgba(153,27,27,0.32), rgba(39,39,42,0.98))', glow: 'rgba(220,38,38,0.13)', path: '/payments' },
    { icon: '🏦', title: 'Мои карты', desc: 'Управление картами', accent: '#bfdbfe', bg: 'linear-gradient(135deg, rgba(32,32,35,0.9), rgba(20,28,40,0.94))', hoverBg: 'linear-gradient(135deg, rgba(30,64,175,0.28), rgba(30,41,59,0.98))', glow: 'rgba(37,99,235,0.12)', path: '/cards' },
    { icon: '📋', title: 'История', desc: 'Все операции', accent: '#d4d4d8', bg: 'linear-gradient(135deg, rgba(45,45,48,0.9), rgba(23,23,23,0.98))', hoverBg: 'linear-gradient(135deg, rgba(63,63,70,0.78), rgba(24,24,27,0.98))', glow: 'rgba(161,161,170,0.12)', path: '/history' },
  ];

  const quickActions = [
    { icon: '📱', label: 'Перевод по телефону', path: '/transfers/phone', accent: '#fca5a5', bg: 'rgba(39,39,42,0.66)', hoverBg: 'rgba(127,29,29,0.32)' },
    { icon: '💳', label: 'Перевод на карту', path: '/transfers/card', accent: '#fecaca', bg: 'rgba(39,39,42,0.66)', hoverBg: 'rgba(153,27,27,0.3)' },
    { icon: '➕', label: 'Создать карту', path: '/cards?create=true', accent: '#bfdbfe', bg: 'rgba(24,24,27,0.72)', hoverBg: 'rgba(30,64,175,0.28)' },
  ];

  return (
    <div style={homePageStyle}>
      <div style={homeBackgroundImageStyle} aria-hidden="true" />
      {user && (
        <div style={homeHeroStyle}>
          <div style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(148,163,184,0.11) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            left: '-120px',
            bottom: '-170px',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(30,64,175,0.11) 0%, transparent 68%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite',
          }} />
          <div style={homeSummaryGridStyle}>
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                Ваш баланс
              </span>
              <button
                type="button"
                onClick={switchBalanceCurrency}
                disabled={balanceLoading || balanceError}
                title="Нажмите, чтобы изменить валюту"
                style={homeBalanceStyle}
              >
                {balanceLoading
                  ? 'Загрузка...'
                  : balanceError || !Number.isFinite(totalBalance)
                    ? 'Не удалось рассчитать'
                    : `${formatMoney(totalBalance)} ${currencySigns[balanceCurrency]}`}
              </button>
              {!balanceLoading && !balanceError && (
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  Нажмите на баланс, чтобы изменить валюту
                </div>
              )}
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                {user.firstName || user.preferred_username} · {new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/cashback')}
              onMouseEnter={() => setCashbackHovered(true)}
              onMouseLeave={() => setCashbackHovered(false)}
              style={{
                ...cashbackSummaryStyle,
                ...(isCashbackHovered ? cashbackSummaryHoverStyle : {}),
              }}
            >
              <span style={cashbackLabelStyle}>Кешбэк за текущий месяц</span>
              <strong style={cashbackValueStyle}>
                {cashbackLoading
                  ? 'Загрузка...'
                  : cashbackError || currentMonthCashback === null
                    ? 'Недоступен'
                    : `${formatCashbackMoney(currentMonthCashback)} руб`}
              </strong>
            </button>
          </div>
        </div>
      )}

      {/* Быстрые действия */}
      <h2 style={homeSectionTitleStyle}>
        БЫСТРЫЕ ДЕЙСТВИЯ
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {quickActions.map((action, i) => (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.path)}
            onMouseEnter={() => setHoveredQuickAction(action.label)}
            onMouseLeave={() => setHoveredQuickAction(null)}
            style={{
              ...quickActionStyle,
              background: hoveredQuickAction === action.label ? action.hoverBg : action.bg,
              borderColor: hoveredQuickAction === action.label ? `${action.accent}66` : 'rgba(255,255,255,0.08)',
              boxShadow: hoveredQuickAction === action.label ? `0 18px 38px ${action.accent}18` : '0 12px 28px rgba(0,0,0,0.18)',
              transform: hoveredQuickAction === action.label ? 'translateY(-2px)' : 'translateY(0)',
              animation: `fadeInUp 0.5s ${0.1 + i * 0.1}s ease-out both`,
            }}>
            <div style={{ ...quickActionIconStyle, color: action.accent, background: `${action.accent}14`, borderColor: `${action.accent}30` }}>{action.icon}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{action.label}</div>
          </button>
        ))}
      </div>

      {/* Услуги */}
      <h2 style={homeSectionTitleStyle}>
        ОСНОВНЫЕ ДЕЙСТВИЯ
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {features.map((f, i) => (
          <button
            key={f.title}
            type="button"
            onClick={() => f.path && navigate(f.path)}
            disabled={!f.path}
            onMouseEnter={() => setHoveredFeature(f.title)}
            onMouseLeave={() => setHoveredFeature(null)}
            style={{
              ...featureCardStyle,
              background: hoveredFeature === f.title ? f.hoverBg : f.bg,
              boxShadow: hoveredFeature === f.title ? `0 24px 54px ${f.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : `0 16px 36px rgba(0,0,0,0.24), 0 0 26px ${f.glow}`,
              borderColor: hoveredFeature === f.title ? `${f.accent}55` : 'rgba(255,255,255,0.08)',
              opacity: f.path ? 1 : 0.55,
              cursor: f.path ? 'pointer' : 'default',
              transform: hoveredFeature === f.title ? 'translateY(-3px)' : 'translateY(0)',
              animation: `fadeInUp 0.5s ${0.2 + i * 0.1}s ease-out both`,
            }}>
            <div style={{ ...featureIconStyle, color: f.accent, background: `${f.accent}12`, borderColor: `${f.accent}2e` }}>{f.icon}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e8e8f0', marginBottom: '0.3rem' }}>{f.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{f.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCashbackMoney(value) {
  return Math.round(Number(value || 0)).toLocaleString('ru-RU', {
    maximumFractionDigits: 0,
  });
}

function calculateCurrentMonthCashback(accruals, rates) {
  if (!rates) return null;

  const now = new Date();
  return accruals.reduce((total, accrual) => {
    const paymentDate = new Date(accrual.paymentTime);
    if (
      paymentDate.getFullYear() !== now.getFullYear()
      || paymentDate.getMonth() !== now.getMonth()
    ) {
      return total;
    }

    const amount = Number(accrual.cashbackAmount || 0);
    const rate = Number(rates[accrual.currency] || 1);
    if (!Number.isFinite(amount) || !Number.isFinite(rate)) return total;
    return total + amount * rate;
  }, 0);
}

const homePageStyle = {
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
  minHeight: 'calc(100vh - 140px)',
  animation: 'fadeInUp 0.5s ease-out',
};

const homeBackgroundImageStyle = {
  position: 'fixed',
  top: '76px',
  right: 0,
  bottom: 0,
  left: '260px',
  zIndex: 0,
  pointerEvents: 'none',
  backgroundImage: `linear-gradient(180deg, rgba(27,27,31,0.08), rgba(27,27,31,0.62)), url(${tradingBackground})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.24,
  filter: 'blur(1px) saturate(0.9)',
  transform: 'scale(1.01)',
};

const homeHeroStyle = {
  padding: '2rem 2.5rem',
  marginBottom: '2rem',
  position: 'relative',
  zIndex: 1,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '22px',
  background: `
    radial-gradient(circle at 14% 10%, rgba(148,163,184,0.12), transparent 34%),
    radial-gradient(circle at 78% 18%, rgba(30,64,175,0.13), transparent 32%),
    radial-gradient(circle at 88% 86%, rgba(34,197,94,0.08), transparent 30%),
    linear-gradient(135deg, rgba(48,48,52,0.94), rgba(28,28,31,0.98) 48%, rgba(20,20,22,0.98))
  `,
  boxShadow: '0 26px 70px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const homeSectionTitleStyle = {
  position: 'relative',
  zIndex: 1,
  fontSize: '1.1rem',
  fontWeight: 650,
  color: 'rgba(245,245,245,0.72)',
  marginBottom: '1rem',
  letterSpacing: '0.5px',
};

const quickActionStyle = {
  position: 'relative',
  zIndex: 1,
  padding: '1.2rem',
  cursor: 'pointer',
  textAlign: 'center',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '18px',
  color: '#fff',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  transition: 'background 0.22s ease, border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease',
};

const quickActionIconStyle = {
  width: '36px',
  height: '36px',
  margin: '0 auto 0.55rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid',
  borderRadius: '12px',
  fontSize: '1.1rem',
};

const featureCardStyle = {
  position: 'relative',
  zIndex: 1,
  padding: '1.5rem',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
  color: '#fff',
  textAlign: 'left',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  transition: 'background 0.22s ease, border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease',
};

const featureIconStyle = {
  width: '44px',
  height: '44px',
  marginBottom: '0.9rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid',
  borderRadius: '14px',
  fontSize: '1.35rem',
};

const homeSummaryGridStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
  gap: '1.5rem',
  alignItems: 'stretch',
};

const cashbackSummaryStyle = {
  width: '100%',
  maxWidth: '260px',
  minHeight: '124px',
  justifySelf: 'end',
  alignSelf: 'start',
  padding: '1rem',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(39,39,42,0.88), rgba(17,24,39,0.94))',
  color: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
  boxShadow: '0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)',
  transition: 'background 0.22s ease, border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease',
};

const cashbackSummaryHoverStyle = {
  background: 'linear-gradient(135deg, rgba(39,39,42,0.95), rgba(30,64,175,0.22))',
  borderColor: 'rgba(147,197,253,0.32)',
  transform: 'translateY(-2px)',
  boxShadow: '0 22px 48px rgba(0,0,0,0.32), 0 0 30px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
};

const cashbackLabelStyle = {
  display: 'block',
  marginBottom: '0.9rem',
  color: 'rgba(255,255,255,0.5)',
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.7px',
  textTransform: 'uppercase',
};

const cashbackValueStyle = {
  minWidth: '42px',
  height: '30px',
  padding: '0 0.65rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '0.65rem',
  border: '1px solid rgba(251,191,36,0.42)',
  borderRadius: '999px',
  background: 'rgba(251,191,36,0.14)',
  color: '#facc15',
  fontSize: '0.78rem',
  fontWeight: 850,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

const homeBalanceStyle = {
  display: 'block',
  padding: 0,
  border: 0,
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '2.8rem',
  fontWeight: 800,
  margin: '0.5rem 0',
  background: 'linear-gradient(115deg, #fff8d6 0%, #f6d365 22%, #fef3c7 40%, #e5e7eb 56%, #b9c2cf 72%, #facc15 100%)',
  backgroundSize: '260% 260%',
  animation: 'gradientShift 4s ease infinite',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.32)) drop-shadow(0 0 22px rgba(229,231,235,0.18))',
  letterSpacing: '-1px',
};
