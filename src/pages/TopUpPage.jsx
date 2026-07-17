import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyCards } from '../api';
import Toast from '../components/Toast';
import { getCardLastFour } from '../utils/cardFormat';

const CBR_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';

export default function TopUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  useEffect(() => {
    fetchCards();
    fetchRates();
  }, []);

  const fetchCards = async () => {
    try {
      const cardsData = await getMyCards();
      setCards(cardsData);

      // Если передан cardId в query, выбираем его
      const preselectedId = searchParams.get('cardId');
      if (preselectedId && cardsData.find(c => c.id.toString() === preselectedId)) {
        setSelectedCardId(preselectedId);
      } else {
        // По умолчанию выбираем рублевую карту
        const rubCard = cardsData.find(c => c.currency === 'RUB');
        if (rubCard) {
          setSelectedCardId(rubCard.id.toString());
        } else if (cardsData.length > 0) {
          setSelectedCardId(cardsData[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки карт:', error);
      showToast('Ошибка при загрузке карт');
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async () => {
    setRatesLoading(true);
    setRatesError(false);

    try {
      // Пробуем через прокси, так как ЦБ может блокировать CORS
      const proxyUrl = `/api/cbr-rates`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        // Пробуем напрямую
        const directResponse = await fetch(CBR_URL);
        if (!directResponse.ok) throw new Error('Failed to fetch rates');
        
        const xmlText = await directResponse.text();
        parseCbrXml(xmlText);
      } else {
        const xmlText = await response.text();
        parseCbrXml(xmlText);
      }
    } catch (error) {
      console.error('Ошибка получения курсов:', error);
      setRatesError(true);
    } finally {
      setRatesLoading(false);
    }
  };

  const parseCbrXml = (xmlText) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const valutes = xml.querySelectorAll('Valute');

    const ratesData = {};
    valutes.forEach(valute => {
      const charCode = valute.querySelector('CharCode')?.textContent;
      const nominal = parseFloat(valute.querySelector('Nominal')?.textContent?.replace(',', '.') || '1');
      const value = parseFloat(valute.querySelector('Value')?.textContent?.replace(',', '.') || '0');
      if (charCode && value > 0) {
        ratesData[charCode] = { nominal, value, rate: value / nominal };
      }
    });

    setRates(ratesData);
  };

  const selectedCard = cards.find(c => c.id.toString() === selectedCardId);

  const getRateForCurrency = (currency) => {
    if (!rates) return null;
    if (currency === 'RUB') return 1;

    const rateData = rates[currency];
    if (!rateData) return null;
    return rateData.rate;
  };

  const currentRate = selectedCard ? getRateForCurrency(selectedCard.currency) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Пока без действия
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="glass"
          style={{ padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={() => navigate(-1)}
        >
          ← Назад
        </button>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Пополнение карты</h1>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          {/* Выбор карты */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              Выберите карту для пополнения
            </label>
            <select
              className="glass"
              style={{
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                fontSize: '1rem'
              }}
              value={selectedCardId}
              onChange={e => setSelectedCardId(e.target.value)}
              disabled={loading}
            >
              {cards.map(card => (
                <option key={card.id} value={card.id}>
                  {card.name || `Карта ${getCardLastFour(card.cardNumber)}`} — •••• {getCardLastFour(card.cardNumber)} — {card.currency === 'RUB' ? 'Рубли' : card.currency === 'USD' ? 'Доллары' : 'Юани'} ({card.balance.toLocaleString('ru-RU')} {card.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Курс валюты */}
          {selectedCard && selectedCard.currency !== 'RUB' && (
            <div
              className="glass"
              style={{
                padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem',
                border: '1px solid rgba(140,242,155,0.3)'
              }}
            >
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>
                Текущий курс ЦБ РФ
              </div>
              {ratesLoading ? (
                <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
                  Загрузка курса...
                </div>
              ) : ratesError ? (
                <div style={{ fontSize: '1rem', color: '#f472b6' }}>
                  Не удалось загрузить курс
                </div>
              ) : currentRate ? (
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0' }}>
                  1 {selectedCard.currency} = {currentRate.toFixed(2)} RUB
                </div>
              ) : (
                <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
                  Курс недоступен
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.3rem' }}>
                Пополнение в рублях
              </div>
            </div>
          )}

          {/* Поле ввода суммы */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              Сумма пополнения (RUB)
            </label>
            <input
              type="number"
              className="glass"
              style={{
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                fontSize: '1.5rem', fontWeight: 700
              }}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          {/* Эквивалент в выбранной валюте */}
          {selectedCard && selectedCard.currency !== 'RUB' && amount && currentRate && (
            <div
              className="glass"
              style={{
                padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>
                Эквивалент в выбранной валюте
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {(parseFloat(amount) / currentRate).toFixed(2)} {selectedCard.currency}
              </div>
            </div>
          )}

          {/* Кнопка пополнения */}
          <button
            type="submit"
            className="glass"
            style={{
              width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 600,
              background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: '12px', cursor: 'pointer'
            }}
          >
            Пополнить
          </button>
        </form>
      </div>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ message: '', visible: false })}
      />
    </div>
  );
}
