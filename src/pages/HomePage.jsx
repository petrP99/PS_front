import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrencyRates, getMyAccounts } from '../api';

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

  const totalBalance = rates
    ? accounts.reduce((totalRub, account) => (
        totalRub + Number(account.balance || 0) * Number(rates[account.currency])
      ), 0) / Number(rates[balanceCurrency])
    : null;

  const switchBalanceCurrency = () => {
    setBalanceCurrency(current => {
      const currentIndex = currencies.indexOf(current);
      return currencies[(currentIndex + 1) % currencies.length];
    });
  };

  const features = [
    { icon: '🔄', title: 'Между своими счетами', desc: 'Перевод между счетами', glow: 'rgba(168,85,247,0.3)', path: '/transfers/accounts' },
    { icon: '💰', title: 'Пополнения', desc: 'Пополнить счёт', glow: 'rgba(6,182,212,0.3)', path: '/replenishment' },
    { icon: '🧾', title: 'Оплата услуг', desc: 'Телефон, интернет, ЖКХ', glow: 'rgba(16,185,129,0.3)', path: '/payments' },
    { icon: '🏦', title: 'Мои карты', desc: 'Управление картами', glow: 'rgba(245,158,11,0.3)', path: '/cards' },
    { icon: '📋', title: 'История', desc: 'Все операции', glow: 'rgba(99,102,241,0.3)', path: '/history' },
  ];

  const quickActions = [
    { icon: '📱', label: 'Перевод по телефону', path: '/transfers/phone' },
    { icon: '💳', label: 'Перевод на карту', path: '/transfers/card' },
    { icon: '➕', label: 'Создать карту', path: '/cards?create=true' },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {user && (
        <div className="glass glow-border" style={{
          padding: '2rem 2.5rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
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
        </div>
      )}

      {/* Быстрые действия */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', letterSpacing: '0.5px' }}>
        БЫСТРЫЕ ДЕЙСТВИЯ
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {quickActions.map((action, i) => (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.path)}
            className="glass"
            style={{
            padding: '1.2rem', cursor: 'pointer', textAlign: 'center',
            animation: `fadeInUp 0.5s ${0.1 + i * 0.1}s ease-out both`,
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
          }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{action.icon}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{action.label}</div>
          </button>
        ))}
      </div>

      {/* Услуги */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', letterSpacing: '0.5px' }}>
        ОСНОВНЫЕ ДЕЙСТВИЯ
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {features.map((f, i) => (
          <button
            key={f.title}
            type="button"
            onClick={() => f.path && navigate(f.path)}
            disabled={!f.path}
            className="glass glow-border"
            style={{
            padding: '1.5rem',
            animation: `fadeInUp 0.5s ${0.2 + i * 0.1}s ease-out both`,
            boxShadow: `0 0 30px ${f.glow}`,
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            textAlign: 'left',
            opacity: f.path ? 1 : 0.55,
            cursor: f.path ? 'pointer' : 'default',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.8rem', animation: 'float 4s ease-in-out infinite' }}>{f.icon}</div>
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

const homeBalanceStyle = {
  display: 'block',
  padding: 0,
  border: 0,
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '2.8rem',
  fontWeight: 800,
  margin: '0.5rem 0',
  background: 'linear-gradient(120deg, #22c55e, #86efac, #10b981, #bbf7d0)',
  backgroundSize: '250% 250%',
  animation: 'gradientShift 4s ease infinite',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '-1px',
};
