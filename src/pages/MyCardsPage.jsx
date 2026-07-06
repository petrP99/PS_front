import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createCard, getMyAccounts, getMyCards, blockCard } from '../api';
import CardNumber from '../components/CardNumber';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { getCardCurrencyStyle } from '../utils/cardAppearance';
import { formatExpireDate, getCardLastFour } from '../utils/cardFormat';

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

  // Группируем карты по счетам
  const cardsByAccount = {};
  cards.forEach(card => {
    if (!cardsByAccount[card.accountId]) {
      cardsByAccount[card.accountId] = [];
    }
    cardsByAccount[card.accountId].push(card);
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Мои карты</h1>
        <button 
          className="glass" 
          style={{ padding: '0.7rem 1.5rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '12px', cursor: 'pointer', color: '#daf5ce' }}
          onClick={() => {
            setNewCardData({ name: '', isPremium: false, accountId: '' });
            setShowCreateForm(true);
          }}
        >
          Создать карту
        </button>
      </div>

      {showCreateForm && (
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Создание новой карты</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Название карты (необязательно)</label>
              <input
                type="text"
                className="glass"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                value={newCardData.name}
                onChange={e => setNewCardData({ ...newCardData, name: e.target.value })}
                placeholder="Например, Основная карта"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Счёт *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <select
                  className="glass"
                  style={{ flex: 1, minWidth: 0, padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
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
            <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Тип карты *</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { value: false, label: 'Стандартная', description: 'Обычная карта для ежедневных операций' },
                { value: true, label: 'Премиум', description: 'Премиальная карта с красивым номером' },
              ].map(type => {
                const selected = newCardData.isPremium === type.value;
                return (
                  <label
                    key={type.label}
                    className="glass"
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: selected ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.1)',
                      background: selected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <input
                        type="radio"
                        name="cardType"
                        checked={selected}
                        onChange={() => setNewCardData({ ...newCardData, isPremium: type.value })}
                      />
                      <strong>{type.label}</strong>
                    </div>
                    <div style={{ paddingLeft: '1.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                      {type.description}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="glass" 
              style={{ padding: '0.7rem 1.5rem', background: 'rgba(99,102,241,0.3)', borderRadius: '10px', cursor: selectedAccount ? 'pointer' : 'not-allowed', opacity: selectedAccount ? 1 : 0.5, color: '#fff' }}
              onClick={handleCreateCard}
              disabled={!selectedAccount}
            >
              Создать
            </button>
            <button 
              className="glass" 
              style={{ padding: '0.7rem 1.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
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
        <div className="glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: '16px' }}>
          <p>У вас пока нет карт</p>
        </div>
      ) : (
        Object.entries(cardsByAccount).map(([accountId, accountCards]) => {
          const account = accountsById.get(accountId);
          const currency = account?.currency || accountCards[0]?.currency;

          return (
            <div key={accountId} className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {accountCards.map(card => {
                  const colorStyle = getCardCurrencyStyle(card.currency);

                  return (
                  <div
                    key={card.id}
                    style={{
                      padding: '1.5rem',
                      paddingTop: '3.3rem',
                      borderRadius: '16px',
                      position: 'relative',
                      cursor: 'pointer',
                      background: colorStyle.background,
                      border: colorStyle.border,
                      boxShadow: colorStyle.boxShadow,
                      backdropFilter: 'blur(20px)',
                    }}
                    onClick={() => navigate(`/cards/${card.id}`)}
                  >
                    <button
                      type="button"
                      title="Открыть счет"
                      onClick={event => {
                        event.stopPropagation();
                        navigate(`/accounts/${card.accountId}`);
                      }}
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        maxWidth: '65%',
                        padding: '0.35rem 0.65rem',
                        overflow: 'hidden',
                        border: `1px solid ${colorStyle.accent}55`,
                        borderRadius: '8px',
                        background: 'rgba(10,10,15,0.36)',
                        color: colorStyle.accent,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {account?.name || `Счет ${String(card.accountId).slice(-4)}`} ↗
                    </button>
                    <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                      {card.name || `Карта ${getCardLastFour(card.cardNumber)}`}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)' }}>
                      <CardNumber cardNumber={card.cardNumber} />
                      <span>{formatExpireDate(card.expireDate)}</span>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      {card.status === 'ACTIVE' && (
                        <button
                          className="glass"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '8px', cursor: 'pointer', color: '#19ff8a' }}
                          onClick={e => { e.stopPropagation(); navigate(`/replenishment?accountId=${card.accountId}`); }}
                        >
                          Пополнить
                        </button>
                      )}
                      {card.status === 'ACTIVE' && (
                        <button
                          className="glass"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgb(163 14 48 / 0.2)', border: '1px solid rgba(236,72,153,0.4)', borderRadius: '8px', cursor: 'pointer', color: '#f69090' }}
                          onClick={e => { e.stopPropagation(); setCardToBlock(card); }}
                        >
                          Заблокировать
                        </button>
                      )}
                    </div>
                    {card.status === 'BLOCKED' && (
                      <div style={{ marginTop: '1rem', color: '#fda4af', fontSize: '0.8rem', fontWeight: 600 }}>
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
