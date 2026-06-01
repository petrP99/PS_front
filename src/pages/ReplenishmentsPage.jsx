import { useState, useEffect } from 'react';
import { getMyReplenishments, getReplenishmentCards, createReplenishment } from '../api';

export default function ReplenishmentsPage() {
  const [replenishments, setReplenishments] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getMyReplenishments().catch(() => []),
      getReplenishmentCards().catch(() => []),
    ]).then(([replData, cardsData]) => {
      setReplenishments(Array.isArray(replData) ? replData : []);
      setCards(Array.isArray(cardsData) ? cardsData : []);
    }).catch(() => setError('Ошибка загрузки данных'))
    .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardNumber || !amount) {
      setError('Заполните все поля');
      return;
    }
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      await createReplenishment({ cardNumber, amount: Number(amount) });
      setSuccess('Пополнение выполнено успешно');
      setCardNumber('');
      setAmount('');
      loadData();
    } catch (err) {
      setError(err.message || 'Ошибка пополнения');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <h1 className="page-title">💰 Пополнения</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Пополнить карту</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Номер карты</label>
              <select className="form-control" value={cardNumber} onChange={e => setCardNumber(e.target.value)} required>
                <option value="">Выберите карту для пополнения</option>
                {cards.map(card => (
                  <option key={card.id} value={card.cardNumber}>
                    {card.cardName || 'Карта'} — {String(card.cardNumber).replace(/(\d{4})(?=\d)/g, '$1 ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Сумма пополнения</label>
              <input
                type="number"
                className="form-control"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <button type="submit" className="btn btn-success" disabled={processing} style={{ width: '100%' }}>
              {processing ? 'Выполнение...' : 'Пополнить'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">История пополнений</div>
          {replenishments.length === 0 ? (
            <div className="empty-state">Нет пополнений</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Карта</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {replenishments.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: '0.85rem' }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
                    <td>•••• {String(r.cardNumber || '').slice(-4)}</td>
                    <td style={{ color: '#28a745', fontWeight: 600 }}>
                      +{Number(r.amount).toLocaleString('ru-RU')} ₽
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                        {r.status || 'COMPLETED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}