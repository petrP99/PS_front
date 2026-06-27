import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCardById, blockCard } from '../api';
import CardNumber from '../components/CardNumber';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { formatExpireDate, getCardLastFour } from '../utils/cardFormat';

export default function CardDetailsPage() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    fetchCard();
  }, [id]);

  const fetchCard = async () => {
    try {
      setLoading(true);
      const cardData = await getCardById(id);
      setCard(cardData);
    } catch (error) {
      console.error('Ошибка при загрузке карты:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  const handleBlockCard = async () => {
    if (!card) return;
    
    try {
      await blockCard(card.id);
      showToast('Карта успешно заблокирована!');
      setCard({ ...card, status: 'BLOCKED' });
    } catch (error) {
      console.error('Ошибка блокировки карты:', error);
      showToast(`Ошибка: ${error.message}`);
    } finally {
      setShowBlockConfirm(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Загрузка информации о карте...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Карта не найдена</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Информация о карте</h1>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Номер карты</div>
            <CardNumber cardNumber={card.cardNumber} style={{ fontSize: '1.2rem', fontWeight: 500 }} />
          </div>
          
          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Название</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>
              {card.name || 'Нет названия'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Валюта</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>
              {card.currency === 'RUB' ? 'Рубли' : card.currency === 'USD' ? 'Доллары' : 'Юани'} ({card.currency})
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Баланс</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {card.balance.toLocaleString('ru-RU')} {card.currency}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Статус</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              {card.status === 'ACTIVE' ? (
                <span style={{ color: '#10b981' }}>Активна</span>
              ) : (
                <span style={{ color: '#f472b6' }}>Заблокирована</span>
              )}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Срок действия</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              {formatExpireDate(card.expireDate)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {card.status === 'ACTIVE' && (
            <button 
              className="glass" 
              style={{ padding: '0.8rem 1.5rem', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
              onClick={() => window.location.href = `/replenishment?accountId=${card.accountId}`}
            >
              Пополнить
            </button>
          )}
          {card.status === 'ACTIVE' && (
            <button 
              className="glass" 
              style={{ padding: '0.8rem 1.5rem', background: 'rgba(236,72,153,0.2)', border: '1px solid rgba(236,72,153,0.4)', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
              onClick={() => setShowBlockConfirm(true)}
            >
              Заблокировать карту
            </button>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ message: '', visible: false })}
      />

      <ConfirmationModal
        isOpen={showBlockConfirm}
        title="Подтверждение блокировки"
        message={`Вы уверены, что хотите заблокировать карту •••• ${getCardLastFour(card.cardNumber)}?`}
        onConfirm={handleBlockCard}
        onCancel={() => setShowBlockConfirm(false)}
      />
    </div>
  );
}
