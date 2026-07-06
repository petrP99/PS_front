import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCashbackAccruals, getCurrencyRates, getMyAccounts } from '../api';
import accountTransferBg from '../assets/home-actions/account-transfer.png';
import cardTransferBg from '../assets/home-actions/card-transfer.png';
import createCardBg from '../assets/home-actions/create-card.png';
import historyBg from '../assets/home-actions/history.png';
import paymentsBg from '../assets/home-actions/payments.png';
import phoneTransferBg from '../assets/home-actions/phone-transfer.png';
import topUpBg from '../assets/home-actions/top-up.png';

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
    { icon: '↔', title: 'Между своими счетами', desc: 'Перевод между счетами', path: '/transfers/accounts', palette: 'slate', image: accountTransferBg },
    { icon: '+', title: 'Пополнения', desc: 'Пополнить счёт', path: '/replenishment', palette: 'emerald', image: topUpBg },
    { icon: '₽', title: 'Оплата услуг', desc: 'Телефон, интернет, ЖКХ', path: '/payments', palette: 'amber', image: paymentsBg },
    { icon: '◇', title: 'Мои карты', desc: 'Управление картами', path: '/cards', palette: 'steel', image: cardTransferBg },
    { icon: '≡', title: 'История', desc: 'Все операции', path: '/history', palette: 'smoke', image: historyBg },
  ];

  const quickActions = [
    { icon: '☎', label: 'Перевод по телефону', path: '/transfers/phone', palette: 'slate', image: phoneTransferBg },
    { icon: '▣', label: 'Перевод на карту', path: '/transfers/card', palette: 'steel', image: cardTransferBg },
    { icon: '+', label: 'Создать карту', path: '/cards?create=true', palette: 'emerald', image: createCardBg },
  ];

  return (
    <div style={homePageStyle}>
      {user && (
        <div className="glass glow-border" style={heroCardStyle}>
          <div style={heroCardGradientStyle} />
          <div style={homeSummaryGridStyle}>
            <div style={{ minWidth: 0 }}>
              <span style={eyebrowStyle}>
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
                <div style={helperTextStyle}>
                  Нажмите на баланс, чтобы изменить валюту
                </div>
              )}
              <p style={userMetaStyle}>
                {user.firstName || user.preferred_username} · {new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/cashback')}
              style={cashbackSummaryStyle}
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
      <h2 style={sectionTitleStyle}>
        БЫСТРЫЕ ДЕЙСТВИЯ
      </h2>
      <div style={quickActionsGridStyle}>
        {quickActions.map((action, i) => (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.path)}
            className="glass"
            style={quickActionStyle(i, action.palette, action.image)}
          >
            <div style={quickActionIconStyle(action.palette)}>{action.icon}</div>
            <div style={quickActionLabelStyle}>{action.label}</div>
          </button>
        ))}
      </div>

      {/* Услуги */}
      <h2 style={sectionTitleStyle}>
        ОСНОВНЫЕ ДЕЙСТВИЯ
      </h2>
      <div style={featuresGridStyle}>
        {features.map((f, i) => (
          <button
            key={f.title}
            type="button"
            onClick={() => f.path && navigate(f.path)}
            disabled={!f.path}
            className="glass glow-border"
            style={featureCardStyle(i, Boolean(f.path), f.palette, f.image)}
          >
            <div style={featureIconStyle(f.palette)}>{f.icon}</div>
            <div style={featureTitleStyle}>{f.title}</div>
            <div style={featureDescStyle}>{f.desc}</div>
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

const homeSummaryGridStyle = {
  position: 'relative',
  zIndex: 3,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 320px)',
  gap: '1.5rem',
  alignItems: 'stretch',
};

const cashbackSummaryStyle = {
  minHeight: '164px',
  padding: '1.35rem',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  background: 'rgba(39,44,55,0.74)',
  color: '#F4F7FB',
  cursor: 'pointer',
  textAlign: 'left',
  boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
  backdropFilter: 'blur(18px)',
};

const cashbackLabelStyle = {
  display: 'block',
  marginBottom: '0.9rem',
  color: 'rgba(244,247,251,0.56)',
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: 'uppercase',
};

const cashbackValueStyle = {
  minWidth: '42px',
  minHeight: '30px',
  padding: '0.45rem 0.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '0.65rem',
  border: '1px solid rgba(251,191,36,0.42)',
  borderRadius: '999px',
  background: 'rgba(251,191,36,0.14)',
  color: '#facc15',
  fontSize: '1rem',
  fontWeight: 850,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

const cashbackHintStyle = {
  color: 'rgba(244,247,251,0.52)',
  fontSize: '0.82rem',
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
  background: 'linear-gradient(120deg, #86EFAC, #22C55E)',
  backgroundSize: '250% 250%',
  animation: 'gradientShift 4s ease infinite',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: 0,
};

const homePageStyle = {
  minHeight: 'calc(100vh - 120px)',
  padding: '1.5rem',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '24px',
  background: 'transparent',
  animation: 'fadeInUp 0.35s ease-out',
};

const heroCardStyle = {
  padding: '2rem 2.5rem',
  marginBottom: '2rem',
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '22px',
  background: 'rgba(39,44,55,0.72)',
  boxShadow: '0 24px 58px rgba(0,0,0,0.2)',
  backdropFilter: 'blur(20px)',
  zIndex: 2,
};

const heroCardGradientStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(90deg, rgba(39,44,55,0.9) 0%, rgba(39,44,55,0.62) 100%)',
  pointerEvents: 'none',
  zIndex: 2,
};

const eyebrowStyle = {
  fontSize: '0.8rem',
  color: 'rgba(244,247,251,0.52)',
  letterSpacing: 0,
  textTransform: 'uppercase',
};

const helperTextStyle = {
  color: 'rgba(244,247,251,0.46)',
  fontSize: '0.75rem',
  marginBottom: '0.5rem',
};

const userMetaStyle = {
  color: 'rgba(244,247,251,0.58)',
  fontSize: '0.9rem',
};

const sectionTitleStyle = {
  position: 'relative',
  zIndex: 2,
  fontSize: '1.08rem',
  fontWeight: 800,
  color: '#F4F7FB',
  marginBottom: '1rem',
  letterSpacing: 0,
};

const quickActionsGridStyle = {
  position: 'relative',
  zIndex: 2,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  marginBottom: '2.5rem',
};

const featuresGridStyle = {
  position: 'relative',
  zIndex: 2,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
  gap: '1rem',
};

const cardPalettes = {
  slate: {
    card: 'rgba(71,78,91,0.78)',
    icon: 'rgba(255,255,255,0.12)',
    border: 'rgba(148,163,184,0.34)',
    accent: '#CBD5E1',
    art: 'rgba(203,213,225,0.1)',
    image: 'radial-gradient(circle at 86% 18%, rgba(203,213,225,0.18), transparent 34%), linear-gradient(135deg, rgba(148,163,184,0.12), transparent 58%)',
  },
  graphite: {
    card: 'rgba(47,52,62,0.82)',
    icon: 'rgba(255,255,255,0.09)',
    border: 'rgba(209,213,219,0.2)',
    accent: '#E5E7EB',
    art: 'rgba(229,231,235,0.08)',
    image: 'radial-gradient(circle at 80% 20%, rgba(229,231,235,0.13), transparent 30%), linear-gradient(145deg, rgba(255,255,255,0.06), transparent 64%)',
  },
  steel: {
    card: 'rgba(83,88,98,0.74)',
    icon: 'rgba(255,255,255,0.14)',
    border: 'rgba(190,199,214,0.32)',
    accent: '#D8DEE9',
    art: 'rgba(216,222,233,0.11)',
    image: 'radial-gradient(circle at 84% 22%, rgba(216,222,233,0.2), transparent 32%), linear-gradient(150deg, rgba(95,103,117,0.28), transparent 62%)',
  },
  charcoal: {
    card: 'rgba(36,40,49,0.84)',
    icon: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.16)',
    accent: '#F3F4F6',
    art: 'rgba(243,244,246,0.08)',
    image: 'radial-gradient(circle at 82% 18%, rgba(255,255,255,0.12), transparent 30%), linear-gradient(140deg, rgba(17,24,39,0.4), transparent 60%)',
  },
  smoke: {
    card: 'rgba(94,96,103,0.68)',
    icon: 'rgba(255,255,255,0.15)',
    border: 'rgba(229,231,235,0.26)',
    accent: '#E5E7EB',
    art: 'rgba(229,231,235,0.12)',
    image: 'radial-gradient(circle at 82% 18%, rgba(229,231,235,0.2), transparent 32%), linear-gradient(150deg, rgba(156,163,175,0.18), transparent 66%)',
  },
  emerald: {
    card: 'rgba(48,70,61,0.72)',
    icon: 'rgba(134,239,172,0.16)',
    border: 'rgba(134,239,172,0.3)',
    accent: '#86EFAC',
    art: 'rgba(134,239,172,0.11)',
    image: 'radial-gradient(circle at 84% 20%, rgba(134,239,172,0.18), transparent 32%), linear-gradient(140deg, rgba(34,197,94,0.12), transparent 62%)',
  },
  amber: {
    card: 'rgba(79,68,47,0.72)',
    icon: 'rgba(251,191,36,0.15)',
    border: 'rgba(251,191,36,0.3)',
    accent: '#FACC15',
    art: 'rgba(251,191,36,0.11)',
    image: 'radial-gradient(circle at 84% 20%, rgba(251,191,36,0.18), transparent 32%), linear-gradient(140deg, rgba(245,158,11,0.12), transparent 62%)',
  },
};

const getCardPalette = palette => cardPalettes[palette] || cardPalettes.graphite;

const quickActionStyle = (index, palette, image) => {
  const colors = getCardPalette(palette);
  return {
  position: 'relative',
  overflow: 'hidden',
  padding: '1.25rem',
  cursor: 'pointer',
  textAlign: 'center',
  animation: `fadeInUp 0.5s ${0.1 + index * 0.1}s ease-out both`,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  color: '#F4F7FB',
  backgroundColor: '#222833',
  backgroundImage: `linear-gradient(180deg, rgba(7,9,13,0.18), rgba(7,9,13,0.72)), url(${image})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 16px 34px rgba(0,0,0,0.2)',
  };
};

const quickActionIconStyle = palette => ({
  position: 'relative',
  zIndex: 1,
  width: '42px',
  height: '42px',
  margin: '0 auto 0.75rem',
  borderRadius: '16px',
  display: 'grid',
  placeItems: 'center',
  color: getCardPalette(palette).accent,
  background: getCardPalette(palette).icon,
  border: `1px solid ${getCardPalette(palette).border}`,
  fontSize: '1.05rem',
  fontWeight: 800,
});

const quickActionLabelStyle = {
  position: 'relative',
  zIndex: 1,
  fontSize: '0.88rem',
  color: '#F8FAFC',
  fontWeight: 700,
  textShadow: '0 1px 8px rgba(0,0,0,0.55)',
};

const featureCardStyle = (index, enabled, palette, image) => {
  const colors = getCardPalette(palette);
  return {
  position: 'relative',
  overflow: 'hidden',
  padding: '1.45rem',
  animation: `fadeInUp 0.5s ${0.2 + index * 0.1}s ease-out both`,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  color: '#F4F7FB',
  textAlign: 'left',
  opacity: enabled ? 1 : 0.55,
  cursor: enabled ? 'pointer' : 'default',
  backgroundColor: '#222833',
  backgroundImage: `linear-gradient(180deg, rgba(7,9,13,0.18), rgba(7,9,13,0.74)), url(${image})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 16px 36px rgba(0,0,0,0.2)',
  };
};

const featureIconStyle = palette => ({
  position: 'relative',
  zIndex: 1,
  width: '44px',
  height: '44px',
  marginBottom: '0.9rem',
  borderRadius: '16px',
  display: 'grid',
  placeItems: 'center',
  color: getCardPalette(palette).accent,
  background: getCardPalette(palette).icon,
  border: `1px solid ${getCardPalette(palette).border}`,
  fontSize: '1.3rem',
  fontWeight: 800,
});

const featureTitleStyle = {
  position: 'relative',
  zIndex: 1,
  fontSize: '0.98rem',
  fontWeight: 800,
  color: '#F4F7FB',
  marginBottom: '0.35rem',
  textShadow: '0 1px 8px rgba(0,0,0,0.6)',
};

const featureDescStyle = {
  position: 'relative',
  zIndex: 1,
  fontSize: '0.82rem',
  color: 'rgba(248,250,252,0.72)',
  textShadow: '0 1px 8px rgba(0,0,0,0.6)',
};
