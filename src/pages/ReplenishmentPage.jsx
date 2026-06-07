import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyCards, getReplenishmentsByCard, replenishCard } from '../api';
import Toast from '../components/Toast';
import { getCardLastFour } from '../utils/cardFormat';

const CBR_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';

export default function ReplenishmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  useEffect(() => {
    fetchCards();
    fetchRates();
  }, []);

  useEffect(() => {
    if (selectedCardId) {
      fetchHistory(selectedCardId);
    }
  }, [selectedCardId]);

  const fetchCards = async () => {
    try {
      const cardsData = await getMyCards();
      setCards(cardsData);

      const preselectedId = searchParams.get('cardId');
      if (preselectedId && cardsData.find(c => c.id.toString() === preselectedId)) {
        setSelectedCardId(preselectedId);
      } else {
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

  const fetchHistory = async (cardId) => {
    setHistoryLoading(true);
    try {
      const data = await getReplenishmentsByCard(cardId);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchRates = async () => {
    setRatesLoading(true);
    setRatesError(false);

    try {
      const directResponse = await fetch(CBR_URL);
      if (!directResponse.ok) throw new Error('Failed to fetch rates');

      const xmlText = await directResponse.text();
      parseCbrXml(xmlText);
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

  const cardLastFour = (card) => getCardLastFour(card?.cardNumber);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCardId || !amount) {
      showToast('Выберите карту и укажите сумму');
      return;
    }

    try {
      await replenishCard(selectedCardId, parseFloat(amount));
      showToast('Карта успешно пополнена!');
      setAmount('');
      // Обновляем историю и баланс
      fetchHistory(selectedCardId);
      fetchCards();
    } catch (error) {
      console.error('Ошибка пополнения:', error);
      showToast(`Ошибка: ${error.message}`);
    }
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Левая колонка — история пополнений */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
            История пополнений
          </h2>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
              Загрузка...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
              История пополнений пуста
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {history.slice(0, 20).map((item, index) => (
                <div
                  key={item.id || index}
                  className="glass"
                  style={{
                    padding: '0.8rem 1rem', borderRadius: '10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#10b981' }}>
                      +{item.amount?.toLocaleString('ru-RU')} {item.currency || 'RUB'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                      {item.date ? new Date(item.date).toLocaleString('ru-RU') : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка — форма пополнения */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                }}
                value={selectedCardId}
                onChange={e => setSelectedCardId(e.target.value)}
                disabled={loading}
              >
                {cards.map(card => (
                  <option key={card.id} value={card.id} style={{ background: '#1e1b4b', color: '#e2e8f0' }}>
                    {card.name ? `${card.name} — ` : ''}•••• {cardLastFour(card)} — {card.balance.toLocaleString('ru-RU')} {card.currency}
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
                  border: '1px solid rgba(99,102,241,0.3)'
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
                  color: '#e2e8f0',
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
      </div>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ message: '', visible: false })}
      />
    </div>
  );
}
