import { useState, useEffect } from 'react';
import { getProfile, getBalance, getMyCards, getMyTransfers, getMyPayments, getMyReplenishments } from '../api';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(null);
  const [cards, setCards] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [replenishments, setReplenishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getProfile().catch(() => null),
      getBalance().catch(() => null),
      getMyCards().catch(() => []),
      getMyTransfers().catch(() => []),
      getMyPayments().catch(() => []),
      getMyReplenishments().catch(() => []),
    ]).then(([profileData, balanceData, cardsData, transfersData, paymentsData, replenishmentsData]) => {
      setProfile(profileData);
      setBalance(balanceData);
      setCards(Array.isArray(cardsData) ? cardsData : []);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setReplenishments(Array.isArray(replenishmentsData) ? replenishmentsData : []);
    }).catch(err => {
      setError('Ошибка загрузки данных');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Главная</h1>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">👤 Профиль</div>
          {profile ? (
            <div>
              <p><strong>Имя:</strong> {profile.firstName} {profile.lastName}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Телефон:</strong> {profile.phone || '—'}</p>
            </div>
          ) : <p className="empty-state">Нет данных</p>}
          <Link to="/profile" className="btn btn-sm" style={{ marginTop: 12 }}>Редактировать</Link>
        </div>

        <div className="card">
          <div className="card-title">💰 Баланс</div>
          {balance !== null ? (
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#28a745' }}>
              {Number(balance).toLocaleString('ru-RU')} ₽
            </div>
          ) : <p className="empty-state">Нет данных</p>}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">💳 Мои карты ({cards.length})</div>
          {cards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cards.slice(0, 3).map(card => (
                <div key={card.id} style={{
                  padding: '12px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>•••• {String(card.cardNumber).slice(-4)}</div>
                  <div style={{ fontWeight: 600 }}>
                    {Number(card.balance).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              ))}
              {cards.length > 3 && <p style={{ color: '#888', fontSize: '0.85rem' }}>и ещё {cards.length - 3} карт(ы)</p>}
            </div>
          ) : <p className="empty-state">Нет карт</p>}
          <Link to="/cards" className="btn btn-sm" style={{ marginTop: 12 }}>Все карты</Link>
        </div>

        <div className="card">
          <div className="card-title">🔄 Последние переводы</div>
          {transfers.length > 0 ? (
            <div>
              {transfers.slice(0, 3).map(t => (
                <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '0.9rem' }}>
                  <div><strong>На карту:</strong> •••• {String(t.receiverCardNumber || '').slice(-4)}</div>
                  <div style={{ color: '#28a745', fontWeight: 600 }}>-{Number(t.amount).toLocaleString('ru-RU')} ₽</div>
                </div>
              ))}
            </div>
          ) : <p className="empty-state">Нет переводов</p>}
          <Link to="/transfers" className="btn btn-sm" style={{ marginTop: 12 }}>Новый перевод</Link>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">📋 Последние платежи</div>
          {payments.length > 0 ? (
            <div>
              {payments.slice(0, 3).map(p => (
                <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '0.9rem' }}>
                  <div><strong>{p.serviceName || 'Услуга'}</strong></div>
                  <div style={{ color: '#dc3545', fontWeight: 600 }}>-{Number(p.amount).toLocaleString('ru-RU')} ₽</div>
                </div>
              ))}
            </div>
          ) : <p className="empty-state">Нет платежей</p>}
          <Link to="/payments" className="btn btn-sm" style={{ marginTop: 12 }}>Новый платёж</Link>
        </div>

        <div className="card">
          <div className="card-title">💰 Последние пополнения</div>
          {replenishments.length > 0 ? (
            <div>
              {replenishments.slice(0, 3).map(r => (
                <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '0.9rem' }}>
                  <div><strong>Карта:</strong> •••• {String(r.cardNumber || '').slice(-4)}</div>
                  <div style={{ color: '#28a745', fontWeight: 600 }}>+{Number(r.amount).toLocaleString('ru-RU')} ₽</div>
                </div>
              ))}
            </div>
          ) : <p className="empty-state">Нет пополнений</p>}
          <Link to="/replenishments" className="btn btn-sm" style={{ marginTop: 12 }}>Пополнить</Link>
        </div>
      </div>
    </div>
  );
}