import React, { useState, useEffect } from 'react';
import { getMyAccounts, createAccount } from '../api';
import Toast from '../components/Toast';
import { getCardCurrencyStyle } from '../utils/cardAppearance';
import { getCardLastFour } from '../utils/cardFormat';

export default function MyAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccountData, setNewAccountData] = useState({ name: '', currency: 'RUB' });
  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await getMyAccounts();
      setAccounts(accounts);
    } catch (error) {
      console.error('Ошибка при загрузке счетов:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  const handleCreateAccount = async () => {
    try {
      await createAccount(newAccountData.currency, newAccountData.name || undefined);
      fetchAccounts();
      setShowCreateForm(false);
      setNewAccountData({ name: '', currency: 'RUB' });
      showToast('Счёт успешно создан!');
    } catch (error) {
      console.error('Ошибка создания счёта:', error);
      showToast(`Ошибка: ${error.message}`);
    }
  };

  // Группируем счета по валюте
  const accountsByCurrency = {};
  accounts.forEach(account => {
    if (!accountsByCurrency[account.currency]) {
      accountsByCurrency[account.currency] = [];
    }
    accountsByCurrency[account.currency].push(account);
  });

  const currencyLabels = {
    RUB: { label: 'Рубли', sign: '₽' },
    USD: { label: 'Доллары', sign: '$' },
    CNY: { label: 'Юани', sign: '¥' },
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Мои счета</h1>
        <button 
          className="glass" 
          style={{ padding: '0.7rem 1.5rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '12px', cursor: 'pointer', color: '#fff' }}
          onClick={() => setShowCreateForm(true)}
        >
          Создать счёт
        </button>
      </div>

      {showCreateForm && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Создание нового счёта</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Название счёта (необязательно)</label>
              <input
                type="text"
                className="glass"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                value={newAccountData.name}
                onChange={e => setNewAccountData({ ...newAccountData, name: e.target.value })}
                placeholder="Например, Накопительный"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Валюта</label>
              <select
                className="glass"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
                value={newAccountData.currency}
                onChange={e => setNewAccountData({ ...newAccountData, currency: e.target.value })}
              >
                <option value="RUB">Рубль (RUB)</option>
                <option value="USD">Доллар (USD)</option>
                <option value="CNY">Юань (CNY)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="glass" 
              style={{ padding: '0.7rem 1.5rem', background: 'rgba(99,102,241,0.3)', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
              onClick={handleCreateAccount}
            >
              Создать
            </button>
            <button 
              className="glass" 
              style={{ padding: '0.7rem 1.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
              onClick={() => setShowCreateForm(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Загрузка счетов...</p>
        </div>
      ) : Object.keys(accountsByCurrency).length === 0 ? (
        <div className="glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: '16px' }}>
          <p>У вас пока нет счетов</p>
        </div>
      ) : (
        Object.entries(accountsByCurrency).map(([currency, currencyAccounts]) => (
          <div key={currency} className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
              {currencyLabels[currency]?.label || currency} ({currency})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(390px, 1fr))', gap: '1rem' }}>
              {currencyAccounts.map(account => {
                const colorStyle = getCardCurrencyStyle(account.currency);

                return (
                  <div
                    key={account.id}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      background: colorStyle.background,
                      border: colorStyle.border,
                      boxShadow: colorStyle.boxShadow,
                      backdropFilter: 'blur(20px)',
                    }}
                    onClick={() => window.location.href = `/accounts/${account.id}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                        {account.name || `Счёт ${account.id.toString().slice(-4)}`}
                      </div>
                      <span style={{ color: colorStyle.accent, fontSize: '0.8rem', fontWeight: 600 }}>
                        {account.status === 'CLOSED' ? 'ЗАКРЫТ' : account.currency}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                      {account.balance.toLocaleString('ru-RU')} {currencyLabels[currency]?.sign || currency}
                    </div>
                    {account.cards?.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}>
                          {account.cards.slice(0, 3).map(card => (
                            <button
                              key={card.id}
                              type="button"
                              title={`Открыть карту •••• ${getCardLastFour(card.cardNumber)}`}
                              onClick={event => {
                                event.stopPropagation();
                                window.location.href = `/cards/${card.id}`;
                              }}
                              style={{
                                minWidth: 0,
                                padding: '0.5rem 0.6rem',
                                border: `1px solid ${colorStyle.accent}55`,
                                borderRadius: '9px',
                                background: 'rgba(10,10,15,0.3)',
                                color: '#fff',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <span
                                style={{
                                  display: 'block',
                                  marginBottom: '0.25rem',
                                  overflow: 'hidden',
                                  color: colorStyle.accent,
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {card.name || 'Карта'}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                •••• {getCardLastFour(card.cardNumber)}
                              </span>
                            </button>
                          ))}
                        </div>
                        {account.cards.length > 3 && (
                          <span
                            title={`Еще карт: ${account.cards.length - 3}`}
                            style={{
                              display: 'block',
                              marginTop: '0.4rem',
                              textAlign: 'right',
                              color: colorStyle.accent,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                          >
                            +{account.cards.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span>Кэшбэк: {account.cashback || 0}%</span>
                        <span>Карт: {account.cards?.length || 0}</span>
                      </div>
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          window.location.href = `/accounts/${account.id}/requisites`;
                        }}
                        style={{
                          padding: '0.4rem 0.75rem',
                          border: `1px solid ${colorStyle.accent}66`,
                          borderRadius: '8px',
                          background: 'rgba(10,10,15,0.3)',
                          color: colorStyle.accent,
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        Реквизиты
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ message: '', visible: false })}
      />
    </div>
  );
}
