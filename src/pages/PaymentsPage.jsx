import { useState, useEffect } from 'react';
import { getMyPayments, getPaymentCards, createPayment } from '../api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [cardId, setCardId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getMyPayments().catch(() => []),
      getPaymentCards().catch(() => []),
    ]).then(([paymentsData, cardsData]) => {
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setCards(Array.isArray(cardsData) ? cardsData : []);
    }).catch(() => setError('Ошибка загрузки данных'))
    .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardId || !serviceName || !amount) {
      setError('Заполните все поля');
      return;
    }
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      await createPayment({ cardId: Number(cardId), serviceName, amount: Number(amount) });
      setSuccess('Платёж выполнен успешно');
      setCardId('');
      setServiceName('');
      setAmount('');
      loadData();
    } catch (err) {
      setError(err.message || 'Ошибка выполнения платежа');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <h1 className="page-title">📋 Платежи</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Новый платёж</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Карта списания</label>
              <select className="form-control" value={cardId} onChange={e => setCardId(e.target.value)} required>
                <option value="">Выберите карту</option>
                {cards.filter(c => !c.blocked).map(card => (
                  <option key={card.id} value={card.id}>
                    {card.cardName || 'Карта'} — {String(card.cardNumber).slice(-4)} — {Number(card.balance).toLocaleString('ru-RU')} ₽
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Услуга</label>
              <select
                className="form-control"
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                required
              >
                <option value="">Выберите услугу</option>
                <option value="Интернет">Интернет</option>
                <option value="Мобильная связь">Мобильная связь</option>
                <option value="Коммунальные услуги">Коммунальные услуги</option>
                <option value="Электроэнергия">Электроэнергия</option>
                <option value="Телевидение">Телевидение</option>
                <option value="Страхование">Страхование</option>
                <option value="Образование">Образование</option>
                <option value="Другое">Другое</option>
              </select>
            </div>

            <div className="form-group">
              <label>Сумма платежа</label>
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
              {processing ? 'Выполнение...' : 'Оплатить'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">История платежей</div>
          {payments.length === 0 ? (
            <div className="empty-state">Нет платежей</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Услуга</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: '0.85rem' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
                    <td>{p.serviceName || '—'}</td>
                    <td style={{ color: '#dc3545', fontWeight: 600 }}>
                      -{Number(p.amount).toLocaleString('ru-RU')} ₽
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status || 'COMPLETED'}
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