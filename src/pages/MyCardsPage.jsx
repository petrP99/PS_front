import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createCard, getMyAccounts, getMyCards, blockCard } from '../api';
import CardNumber from '../components/CardNumber';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { getCardCurrencyStyle } from '../utils/cardAppearance';
import { formatExpireDate, getCardLastFour } from '../utils/cardFormat';
import './FinanceCatalog.css';

const HIDE_BLOCKED_CARDS_KEY = 'payflow.cards.hideBlocked';

const readStoredFlag = (key) => {
  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export default function MyCardsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedAccountId = searchParams.get('accountId') || '';
  const createRequested = searchParams.get('create') === 'true';
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardToBlock, setCardToBlock] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(Boolean(requestedAccountId) || createRequested);
  const [creationSucceeded, setCreationSucceeded] = useState(false);
  const [newCardData, setNewCardData] = useState({
    name: '',
    isPremium: false,
    accountId: '',
  });
  const [hideBlockedCards, setHideBlockedCards] = useState(() => readStoredFlag(HIDE_BLOCKED_CARDS_KEY));
  const [toast, setToast] = useState({ message: '', visible: false });
  const currencyFlags = {
    RUB: '🇷🇺',
    USD: '🇺🇸',
    CNY: '🇨🇳',
  };
  const currencyLabels = {
    RUB: { label: 'Рубли', sign: '₽' },
    USD: { label: 'Доллары', sign: '$' },
    CNY: { label: 'Юани', sign: '¥' },
  };
  const activeAccounts = useMemo(
    () => accounts.filter(account => account.status === 'ACTIVE'),
    [accounts]
  );
  const selectedAccount = activeAccounts.find(account => account.id === newCardData.accountId);
  const accountsById = new Map(accounts.map(account => [account.id, account]));
  const blockedCardsCount = useMemo(
    () => cards.filter(card => card.status === 'BLOCKED').length,
    [cards]
  );
  const visibleCards = useMemo(
    () => hideBlockedCards ? cards.filter(card => card.status !== 'BLOCKED') : cards,
    [cards, hideBlockedCards]
  );
  const cardsByAccount = useMemo(() => visibleCards.reduce((groups, card) => {
    if (!groups[card.accountId]) groups[card.accountId] = [];
    groups[card.accountId].push(card);
    return groups;
  }, {}), [visibleCards]);

  useEffect(() => {
    fetchCards();
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (requestedAccountId && activeAccounts.some(account => account.id === requestedAccountId)) {
      setNewCardData(data => ({ ...data, accountId: requestedAccountId }));
      setShowCreateForm(true);
    } else if (createRequested) {
      setShowCreateForm(true);
    }
  }, [activeAccounts, createRequested, requestedAccountId]);

  useEffect(() => {
    if (!creationSucceeded) return undefined;

    const timer = window.setTimeout(() => {
      setCreationSucceeded(false);
      setShowCreateForm(false);
      setNewCardData({ name: '', isPremium: false, accountId: '' });
      navigate('/cards', { replace: true });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [creationSucceeded, navigate]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const cards = await getMyCards();
      setCards(cards);
    } catch (error) {
      console.error('Ошибка при загрузке карт:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  const fetchAccounts = async () => {
    try {
      const accounts = await getMyAccounts();
      setAccounts(accounts);
    } catch (error) {
      console.error('Ошибка при загрузке счетов:', error);
      showToast(`Ошибка загрузки счетов: ${error.message}`);
    }
  };

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setNewCardData({ name: '', isPremium: false, accountId: '' });
    if (requestedAccountId || createRequested) {
      navigate('/cards', { replace: true });
    }
  };

  const handleCreateCard = async () => {
    if (!selectedAccount) {
      showToast('Выберите активный счёт для привязки карты');
      return;
    }

    try {
      await createCard({
        name: newCardData.name || undefined,
        currency: selectedAccount.currency,
        isPremium: newCardData.isPremium,
        accountId: newCardData.accountId,
      });
      setCreationSucceeded(true);
      void fetchCards();
    } catch (error) {
      console.error('Ошибка создания карты:', error);
      showToast(`Ошибка: ${error.message}`);
    }
  };

  const handleBlockCard = async () => {
    if (!cardToBlock) return;
    
    try {
      await blockCard(cardToBlock.id);
      fetchCards();
      showToast('Карта успешно заблокирована!');
    } catch (error) {
      console.error('Ошибка блокировки карты:', error);
      showToast(`Ошибка: ${error.message}`);
    } finally {
      setCardToBlock(null);
    }
  };

  const toggleBlockedCards = () => {
    setHideBlockedCards(currentValue => {
      const nextValue = !currentValue;
      try {
        window.localStorage.setItem(HIDE_BLOCKED_CARDS_KEY, String(nextValue));
      } catch {
        // Фильтр продолжит работать до перезагрузки, даже если storage недоступен.
      }
      return nextValue;
    });
  };

  const openCreateForm = () => {
    setNewCardData({ name: '', isPremium: false, accountId: '' });
    setShowCreateForm(true);
  };

  const renderEmptyState = () => {
    if (cards.length > 0 && hideBlockedCards && visibleCards.length === 0) {
      return (
        <div className="glass finance-empty-state">
          <p>Все заблокированные карты скрыты</p>
          <button type="button" className="finance-action finance-action--filter is-active" onClick={toggleBlockedCards}>
            Показать карты
          </button>
        </div>
      );
    }

    return (
      <div className="glass finance-empty-state">
        <p>У вас пока нет карт</p>
        <button type="button" className="finance-action finance-action--primary" onClick={openCreateForm}>
          Создать первую карту
        </button>
      </div>
    );
  };

  return (
    <div className="finance-catalog">
      <div className="finance-catalog__header">
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Мои карты</h1>
        <div className="finance-catalog__header-actions">
          <button
            type="button"
            className={`finance-action finance-action--filter${hideBlockedCards ? ' is-active' : ''}`}
            onClick={toggleBlockedCards}
            disabled={blockedCardsCount === 0}
          >
            {blockedCardsCount === 0
              ? 'Нет заблокированных карт'
              : hideBlockedCards
                ? `Показать заблокированные (${blockedCardsCount})`
                : `Скрыть заблокированные (${blockedCardsCount})`}
          </button>
          <button type="button" className="finance-action finance-action--primary" onClick={openCreateForm}>
            + Создать карту
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="glass finance-create-panel">
          <h2>Создание новой карты</h2>
          <div className="finance-form-grid">
            <div>
              <label className="finance-field__label" htmlFor="card-name">Название карты (необязательно)</label>
              <input
                id="card-name"
                type="text"
                className="finance-control"
                value={newCardData.name}
                onChange={e => setNewCardData({ ...newCardData, name: e.target.value })}
                placeholder="Например, Основная карта"
              />
            </div>
            <div>
              <label className="finance-field__label" htmlFor="card-account">Счёт *</label>
              <div className="finance-select-row">
                <select
                  id="card-account"
                  className="finance-control"
                  value={newCardData.accountId}
                  onChange={e => setNewCardData({ ...newCardData, accountId: e.target.value })}
                  required
                >
                  <option value="">{activeAccounts.length ? 'Выберите счёт' : 'Нет активных счетов'}</option>
                  {activeAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name || `Счёт ${account.id.slice(-4)}`} — {account.currency}
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <span
                    title={selectedAccount.currency}
                    style={{ fontSize: '1.35rem', lineHeight: 1, flexShrink: 0 }}
                  >
                    {currencyFlags[selectedAccount.currency] || '🌐'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="finance-field__label" style={{ marginBottom: '0.75rem' }}>Тип карты *</div>
            <div className="finance-choice-grid" style={{ marginBottom: 0 }}>
              {[
                { value: false, label: 'Стандартная', description: 'Обычная карта для ежедневных операций' },
                { value: true, label: 'Премиум', description: 'Премиальная карта с красивым номером' },
              ].map(type => {
                const selected = newCardData.isPremium === type.value;
                return (
                  <label
                    key={type.label}
                    className={`finance-choice${selected ? ' is-selected' : ''}`}
                  >
                    <div className="finance-choice__title">
                      <input
                        type="radio"
                        name="cardType"
                        checked={selected}
                        onChange={() => setNewCardData({ ...newCardData, isPremium: type.value })}
                      />
                      <strong>{type.label}</strong>
                    </div>
                    <div className="finance-choice__description">
                      {type.description}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="finance-catalog__form-actions">
            <button 
              className="finance-action finance-action--primary"
              onClick={handleCreateCard}
              disabled={!selectedAccount}
            >
              Создать
            </button>
            <button 
              className="finance-action finance-action--secondary"
              onClick={resetCreateForm}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Загрузка карт...</p>
        </div>
      ) : Object.keys(cardsByAccount).length === 0 ? (
        renderEmptyState()
      ) : (
        Object.entries(cardsByAccount).map(([accountId, accountCards]) => {
          const account = accountsById.get(accountId);
          const currency = account?.currency || accountCards[0]?.currency;

          return (
            <div key={accountId} className="glass finance-group">
              <div className="finance-group__header">
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {account?.name || `Счет ${String(accountId).slice(-4)}`}
                  </h2>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    {currencyLabels[currency]?.label || currency} ({currency})
                  </div>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {Number(account?.balance || 0).toLocaleString('ru-RU')} {currencyLabels[currency]?.sign || currency}
                </div>
              </div>
              <div className="finance-grid">
                {accountCards.map(card => {
                  const colorStyle = getCardCurrencyStyle(card.currency);

                  return (
                  <div
                    key={card.id}
                    className={`finance-item-card finance-item-card--payment-card${card.status === 'BLOCKED' ? ' is-blocked' : ''}`}
                    style={{
                      '--finance-accent': colorStyle.accent,
                      '--finance-accent-soft': colorStyle.accentSoft,
                      '--finance-accent-border': colorStyle.accentBorder,
                      background: colorStyle.background,
                      border: colorStyle.border,
                      boxShadow: colorStyle.boxShadow,
                    }}
                    onClick={() => navigate(`/cards/${card.id}`)}
                  >
                    <button
                      type="button"
                      title="Открыть счет"
                      className="finance-inline-link finance-card__account-link"
                      onClick={event => {
                        event.stopPropagation();
                        navigate(`/accounts/${card.accountId}`);
                      }}
                    >
                      {account?.name || `Счет ${String(card.accountId).slice(-4)}`} ↗
                    </button>
                    <div className="finance-card__name">
                      {card.name || `Карта ${getCardLastFour(card.cardNumber)}`}
                    </div>
                    <div className="finance-card__details">
                      <CardNumber cardNumber={card.cardNumber} />
                      <span>{formatExpireDate(card.expireDate)}</span>
                    </div>
                    <div className="finance-card__actions">
                      {card.status === 'ACTIVE' && (
                        <button
                          className="finance-action finance-action--topup"
                          onClick={e => { e.stopPropagation(); navigate(`/replenishment?accountId=${card.accountId}`); }}
                        >
                          Пополнить
                        </button>
                      )}
                      {card.status === 'ACTIVE' && (
                        <button
                          className="finance-action finance-action--danger"
                          onClick={e => { e.stopPropagation(); setCardToBlock(card); }}
                        >
                          Заблокировать
                        </button>
                      )}
                    </div>
                    {card.status === 'BLOCKED' && (
                      <div className="finance-status finance-status--blocked" style={{ marginTop: '1rem' }}>
                        Заблокирована
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ message: '', visible: false })}
      />

      {creationSucceeded && (
        <div role="dialog" aria-modal="true" aria-labelledby="card-created-title" style={successOverlayStyle}>
          <div className="glass" style={successModalStyle}>
            <div style={successIconStyle}>✓</div>
            <h2 id="card-created-title" style={{ marginBottom: '0.6rem' }}>Карта успешно создана</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Переходим к списку карт...</p>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!cardToBlock}
        title="Подтверждение блокировки"
        message={`Вы уверены, что хотите заблокировать карту •••• ${getCardLastFour(cardToBlock?.cardNumber)}?`}
        onConfirm={handleBlockCard}
        onCancel={() => setCardToBlock(null)}
      />
    </div>
  );
}

const successOverlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: 'rgba(0,0,0,0.55)',
  animation: 'fadeIn 0.3s ease-out',
};

const successModalStyle = {
  width: 'min(90%, 450px)',
  padding: '2.5rem',
  borderRadius: '20px',
  textAlign: 'center',
  animation: 'scaleIn 0.3s ease-out',
};

const successIconStyle = {
  width: '76px',
  height: '76px',
  margin: '0 auto 1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'rgba(34,197,94,0.14)',
  border: '1px solid rgba(34,197,94,0.4)',
  color: '#86efac',
  fontSize: '2rem',
};
