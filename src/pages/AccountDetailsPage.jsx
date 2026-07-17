import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { closeAccount, getAccountById } from '../api';
import CardNumber from '../components/CardNumber';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { getCardCurrencyStyle } from '../utils/cardAppearance';
import { formatExpireDate, getCardLastFour } from '../utils/cardFormat';

export default function AccountDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closeModal, setCloseModal] = useState(null);
  const [closureRequested, setClosureRequested] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    fetchAccount();
  }, [id]);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const accountData = await getAccountById(id);
      setAccount(accountData);
    } catch (error) {
      console.error('Ошибка при загрузке счёта:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  const handleCloseClick = () => {
    if (Number(account.balance) !== 0) {
      setCloseModal('balance');
      return;
    }
    setCloseModal('confirm');
  };

  const handleCloseAccount = async () => {
    try {
      setCloseModal(null);
      setClosureRequested(true);
      await closeAccount(account.id);
      showToast('Запрос на закрытие счета отправлен');
      setTimeout(fetchAccount, 1200);
    } catch (error) {
      console.error('Ошибка закрытия счета:', error);
      setClosureRequested(false);
      showToast(`Ошибка: ${error.message}`);
    }
  };

  const currencyLabels = {
    RUB: { label: 'Рубли', sign: '₽' },
    USD: { label: 'Доллары', sign: '$' },
    CNY: { label: 'Юани', sign: '¥' },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Загрузка информации о счёте...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Счёт не найден</p>
      </div>
    );
  }

  const currencyInfo = currencyLabels[account.currency] || { label: account.currency, sign: '' };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Информация о счёте</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {account.status !== 'CLOSED' && (
            <button
              className="glass"
              style={{ padding: '0.7rem 1.5rem', background: 'rgba(140,242,155,0.14)', border: '1px solid rgba(140,242,155,0.4)', borderRadius: '12px', cursor: 'pointer', color: '#8cf29b' }}
              onClick={() => navigate(`/cards?accountId=${account.id}`)}
            >
              Создать карту
            </button>
          )}
          {account.status !== 'CLOSED' ? (
            <button
              className="glass"
              disabled={closureRequested}
              style={{
                padding: '0.7rem 1.5rem',
                background: 'rgba(236,72,153,0.18)',
                border: '1px solid rgba(236,72,153,0.4)',
                borderRadius: '12px',
                color: '#fda4af',
                cursor: closureRequested ? 'wait' : 'pointer',
                opacity: closureRequested ? 0.6 : 1,
              }}
              onClick={handleCloseClick}
            >
              {closureRequested ? 'Закрытие...' : 'Закрыть счет'}
            </button>
          ) : (
            <span style={{ padding: '0.7rem 1rem', borderRadius: '10px', background: 'rgba(148,163,184,0.14)', color: '#cbd5e1', fontWeight: 600 }}>
              Счет закрыт
            </span>
          )}
        </div>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Название</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>
              {account.name || `Счёт ${account.id.toString().slice(-4)}`}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Валюта</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>
              {currencyInfo.label} ({account.currency})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Баланс</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {account.balance.toLocaleString('ru-RU')} {currencyInfo.sign}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Кэшбэк</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>
              {account.cashback || 0}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Статус</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500, color: account.status === 'CLOSED' ? '#cbd5e1' : '#86efac' }}>
              {account.status === 'CLOSED' ? 'Закрыт' : 'Активен'}
            </div>
          </div>
        </div>

        {/* Привязанные карты */}
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
            Привязанные карты ({account.cards?.length || 0})
          </h2>
          {account.cards && account.cards.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {account.cards.map(card => {
                const colorStyle = getCardCurrencyStyle(card.currency);

                return (
                  <div
                    key={card.id}
                    style={{
                      padding: '1.2rem',
                      paddingTop: '3.1rem',
                      borderRadius: '14px',
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
                        navigate(`/accounts/${account.id}`);
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.85rem',
                        right: '0.85rem',
                        maxWidth: '70%',
                        padding: '0.3rem 0.6rem',
                        overflow: 'hidden',
                        border: `1px solid ${colorStyle.accent}55`,
                        borderRadius: '8px',
                        background: 'rgba(10,10,15,0.36)',
                        color: colorStyle.accent,
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {account.name || `Счет ${account.id.slice(-4)}`} ↗
                    </button>
                    <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                      {card.name || `Карта ${getCardLastFour(card.cardNumber)}`}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      {card.balance.toLocaleString('ru-RU')} {card.currency === 'RUB' ? '₽' : card.currency === 'USD' ? '$' : '¥'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.72)' }}>
                      <CardNumber cardNumber={card.cardNumber} />
                      <span>{formatExpireDate(card.expireDate)}</span>
                    </div>
                    {card.status === 'BLOCKED' && (
                      <div style={{ marginTop: '0.5rem', color: '#fda4af', fontSize: '0.8rem', fontWeight: 600 }}>
                        Заблокирована
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>К счёту не привязано ни одной карты</p>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ message: '', visible: false })}
      />

      <ConfirmationModal
        isOpen={closeModal === 'balance'}
        title="Закрытие счета невозможно"
        message="Закрыть счет можно только при нулевом балансе. Переведите или снимите оставшиеся средства и повторите попытку."
        confirmText="Понятно"
        showCancel={false}
        onConfirm={() => setCloseModal(null)}
        onCancel={() => setCloseModal(null)}
      />

      <ConfirmationModal
        isOpen={closeModal === 'confirm'}
        title="Закрыть счет?"
        message="Операцию невозможно отменить. После подтверждения запрос будет отправлен на закрытие счета."
        confirmText="Закрыть безвозвратно"
        onConfirm={handleCloseAccount}
        onCancel={() => setCloseModal(null)}
      />
    </div>
  );
}
