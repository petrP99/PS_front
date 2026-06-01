import { useState, useEffect } from 'react';
import { getMyCards, getMyTransfers, previewTransfer, previewTransferByPhone, createTransfer } from '../api';

export default function TransfersPage() {
  const [cards, setCards] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [type, setType] = useState('card'); // 'card' or 'phone'
  const [fromCardId, setFromCardId] = useState('');
  const [toCardNumber, setToCardNumber] = useState('');
  const [toPhone, setToPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getMyCards().catch(() => []),
      getMyTransfers().catch(() => []),
    ]).then(([cardsData, transfersData]) => {
      setCards(Array.isArray(cardsData) ? cardsData : []);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
    }).catch(() => setError('Ошибка загрузки данных'))
    .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handlePreview = async () => {
    setError('');
    setPreview(null);
    if (!fromCardId || !amount) {
      setError('Выберите карту и укажите сумму');
      return;
    }
    try {
      let result;
      if (type === 'card') {
        if (!toCardNumber) { setError('Укажите номер карты получателя'); return; }
        result = await previewTransfer({ fromCardId: Number(fromCardId), toCardNumber, amount: Number(amount) });
      } else {
        if (!toPhone) { setError('Укажите номер телефона'); return; }
        result = await previewTransferByPhone({ fromCardId: Number(fromCardId), phone: toPhone, amount: Number(amount) });
      }
      setPreview(result);
    } catch (err) {
      setError(err.message || 'Ошибка предпросмотра перевода');
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      if (type === 'card') {
        await createTransfer({ fromCardId: Number(fromCardId), toCardNumber, amount: Number(amount) });
      } else {
        await createTransfer({ fromCardId: Number(fromCardId), phone: toPhone, amount: Number(amount) });
      }
      setSuccess('Перевод выполнен успешно');
      setPreview(null);
      setAmount('');
      setToCardNumber('');
      setToPhone('');
      loadData();
    } catch (err) {
      setError(err.message || 'Ошибка выполнения перевода');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <h1 className="page-title">🔄 Переводы</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Новый перевод</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={`btn btn-sm ${type === 'card' ? '' : 'btn-outline'}`}
              onClick={() => { setType('card'); setPreview(null); }}
            >
              По карте
            </button>
            <button
              className={`btn btn-sm ${type === 'phone' ? '' : 'btn-outline'}`}
              onClick={() => { setType('phone'); setPreview(null); }}
            >
              По телефону
            </button>
          </div>

          <div className="form-group">
            <label>С какой карты</label>
            <select className="form-control" value={fromCardId} onChange={e => { setFromCardId(e.target.value); setPreview(null); }}>
              <option value="">Выберите карту</option>
              {cards.filter(c => !c.blocked).map(card => (
                <option key={card.id} value={card.id}>
                  {card.cardName || 'Карта'} — {String(card.cardNumber).slice(-4)} — {Number(card.balance).toLocaleString('ru-RU')} ₽
                </option>
              ))}
            </select>
          </div>

          {type === 'card' ? (
            <div className="form-group">
              <label>Номер карты получателя</label>
              <input
                type="text"
                className="form-control"
                value={toCardNumber}
                onChange={e => { setToCardNumber(e.target.value); setPreview(null); }}
                placeholder="Номер карты"
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Номер телефона получателя</label>
              <input
                type="text"
                className="form-control"
                value={toPhone}
                onChange={e => { setToPhone(e.target.value); setPreview(null); }}
                placeholder="+79XXXXXXXXX"
              />
            </div>
          )}

          <div className="form-group">
            <label>Сумма перевода</label>
            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={e => { setAmount(e.target.value); setPreview(null); }}
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
          </div>

          {!preview ? (
            <button onClick={handlePreview} className="btn" style={{ width: '100%' }}>
              Предпросмотр
            </button>
          ) : (
            <div>
              <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 8, marginBottom: 16 }}>
                <p><strong>С карты:</strong> •••• {String(preview.fromCardNumber || '').slice(-4)}</p>
                <p><strong>На карту:</strong> •••• {String(preview.toCardNumber || '').slice(-4)}</p>
                <p><strong>Получатель:</strong> {preview.receiverName || '—'}</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#dc3545' }}>
                  Сумма: {Number(preview.amount || amount).toLocaleString('ru-RU')} ₽
                </p>
                {preview.commission > 0 && (
                  <p style={{ color: '#856404' }}>Комиссия: {Number(preview.commission).toLocaleString('ru-RU')} ₽</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleConfirm} className="btn btn-success" disabled={processing} style={{ flex: 1 }}>
                  {processing ? 'Выполнение...' : 'Подтвердить перевод'}
                </button>
                <button onClick={() => setPreview(null)} className="btn" style={{ background: '#6c757d' }}>
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">История переводов</div>
          {transfers.length === 0 ? (
            <div className="empty-state">Нет переводов</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Получатель</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.85rem' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
                    <td>{t.receiverName || '—'}</td>
                    <td style={{ color: '#dc3545', fontWeight: 600 }}>
                      -{Number(t.amount).toLocaleString('ru-RU')} ₽
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : t.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                        {t.status || 'COMPLETED'}
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