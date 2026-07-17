import React, { useState, useEffect, useMemo } from 'react';
import { getMyAccounts, createAccount } from '../api';
import Toast from '../components/Toast';
import { getCardCurrencyStyle } from '../utils/cardAppearance';
import { getCardLastFour } from '../utils/cardFormat';
import './FinanceCatalog.css';

const HIDE_CLOSED_ACCOUNTS_KEY = 'payflow.accounts.hideClosed';

const readStoredFlag = (key) => {
  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export default function MyAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccountData, setNewAccountData] = useState({ name: '', currency: 'RUB' });
  const [hideClosedAccounts, setHideClosedAccounts] = useState(() => readStoredFlag(HIDE_CLOSED_ACCOUNTS_KEY));
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

  const closedAccountsCount = useMemo(
    () => accounts.filter(account => account.status === 'CLOSED').length,
    [accounts]
  );
  const visibleAccounts = useMemo(
    () => hideClosedAccounts ? accounts.filter(account => account.status !== 'CLOSED') : accounts,
    [accounts, hideClosedAccounts]
  );
  const accountsByCurrency = useMemo(() => visibleAccounts.reduce((groups, account) => {
    if (!groups[account.currency]) groups[account.currency] = [];
    groups[account.currency].push(account);
    return groups;
  }, {}), [visibleAccounts]);

  const toggleClosedAccounts = () => {
    setHideClosedAccounts(currentValue => {
      const nextValue = !currentValue;
      try {
        window.localStorage.setItem(HIDE_CLOSED_ACCOUNTS_KEY, String(nextValue));
      } catch {
        // Фильтр продолжит работать до перезагрузки, даже если storage недоступен.
      }
      return nextValue;
    });
  };

  const renderEmptyState = () => {
    if (accounts.length > 0 && hideClosedAccounts && visibleAccounts.length === 0) {
      return (
        <div className="glass finance-empty-state">
          <p>Все закрытые счета скрыты</p>
          <button type="button" className="finance-action finance-action--filter is-active" onClick={toggleClosedAccounts}>
            Показать счета
          </button>
        </div>
      );
    }

    return (
      <div className="glass finance-empty-state">
        <p>У вас пока нет счетов</p>
        <button type="button" className="finance-action finance-action--primary" onClick={() => setShowCreateForm(true)}>
          Создать первый счёт
        </button>
      </div>
    );
  };

  const currencyLabels = {
    RUB: { label: 'Рубли', sign: '₽' },
    USD: { label: 'Доллары', sign: '$' },
    CNY: { label: 'Юани', sign: '¥' },
  };

  return (
    <div className="finance-catalog">
      <div className="finance-catalog__header">
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Мои счета</h1>
        <div className="finance-catalog__header-actions">
          <button
            type="button"
            className={`finance-action finance-action--filter${hideClosedAccounts ? ' is-active' : ''}`}
            onClick={toggleClosedAccounts}
            disabled={closedAccountsCount === 0}
          >
            {closedAccountsCount === 0
              ? 'Нет закрытых счетов'
              : hideClosedAccounts
                ? `Показать закрытые (${closedAccountsCount})`
                : `Скрыть закрытые (${closedAccountsCount})`}
          </button>
          <button type="button" className="finance-action finance-action--primary" onClick={() => setShowCreateForm(true)}>
            + Создать счёт
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="glass finance-create-panel">
          <h2>Создание нового счёта</h2>
          <div className="finance-form-grid">
            <div>
              <label className="finance-field__label" htmlFor="account-name">Название счёта (необязательно)</label>
              <input
                id="account-name"
                type="text"
                className="finance-control"
                value={newAccountData.name}
                onChange={e => setNewAccountData({ ...newAccountData, name: e.target.value })}
                placeholder="Например, Накопительный"
              />
            </div>
            <div>
              <label className="finance-field__label" htmlFor="account-currency">Валюта</label>
              <select
                id="account-currency"
                className="finance-control"
                value={newAccountData.currency}
                onChange={e => setNewAccountData({ ...newAccountData, currency: e.target.value })}
              >
                <option value="RUB">Рубль (RUB)</option>
                <option value="USD">Доллар (USD)</option>
                <option value="CNY">Юань (CNY)</option>
              </select>
            </div>
          </div>
          <div className="finance-catalog__form-actions">
            <button 
              className="finance-action finance-action--primary"
              onClick={handleCreateAccount}
            >
              Создать
            </button>
            <button 
              className="finance-action finance-action--secondary"
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
        renderEmptyState()
      ) : (
        Object.entries(accountsByCurrency).map(([currency, currencyAccounts]) => (
          <div key={currency} className="glass finance-group">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
              {currencyLabels[currency]?.label || currency} ({currency})
            </h2>
            <div className="finance-grid finance-grid--accounts">
              {currencyAccounts.map(account => {
                const colorStyle = getCardCurrencyStyle(account.currency);

                return (
                  <div
                    key={account.id}
                    className={`finance-item-card${account.status === 'CLOSED' ? ' is-closed' : ''}`}
                    style={{
                      '--finance-accent': colorStyle.accent,
                      '--finance-accent-soft': colorStyle.accentSoft,
                      '--finance-accent-border': colorStyle.accentBorder,
                      background: colorStyle.background,
                      border: colorStyle.border,
                      boxShadow: colorStyle.boxShadow,
                    }}
                    onClick={() => window.location.href = `/accounts/${account.id}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                        {account.name || `Счёт ${account.id.toString().slice(-4)}`}
                      </div>
                      <span className={`finance-status${account.status === 'CLOSED' ? ' finance-status--closed' : ''}`}>
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
                              className="finance-mini-card"
                              title={`Открыть карту •••• ${getCardLastFour(card.cardNumber)}`}
                              onClick={event => {
                                event.stopPropagation();
                                window.location.href = `/cards/${card.id}`;
                              }}
                            >
                              <span className="finance-mini-card__name">
                                {card.name || 'Карта'}
                              </span>
                              <span className="finance-mini-card__number">
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
                        className="finance-inline-link"
                        onClick={event => {
                          event.stopPropagation();
                          window.location.href = `/accounts/${account.id}/requisites`;
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
