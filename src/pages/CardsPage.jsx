import { useState, useEffect } from 'react';
import { getMyCards, createCard, blockCard, deleteCard } from '../api';

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadCards = () => {
    setLoading(true);
    getMyCards()
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch(err => setError('Ошибка загрузки карт'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await createCard({ cardName: newCardName });
      setSuccess('Карта создана успешно');
      setNewCardName('');
      setShowCreate(false);
      loadCards();
    } catch (err) {
      setError(err.message || 'Ошибка создания карты');
    } finally {
      setCreating(false);
    }
  };

  const handleBlock = async (id) => {
    if (!window.confirm('Вы уверены, что хотите заблокировать карту?')) return;
    try {
      await blockCard(id);
      setSuccess('Карта заблокирована');
      loadCards();
    } catch (err) {
      setError(err.message || 'Ошибка блокировки');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить карту?')) return;
    try {
      await deleteCard(id);
      setSuccess('Карта удалена');
      loadCards();
    } catch (err) {
      setError(err.message || 'Ошибка удаления');
    }
  };

  if (loading) return <div className="loading">Загрузка карт...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>💳 Мои карты</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-success">
          + Новая карта
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showCreate && (
        <div className="card">
          <div className="card-title">Создать новую карту</div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Название карты</label>
              <input
                type="text"
                className="form-control"
                value={newCardName}
                onChange={e => setNewCardName(e.target.value)}
                placeholder="Например: Зарплатная, Кредитная..."
                required
              />
            </div>
            <button type="submit" className="btn btn-success" disabled={creating} style={{ marginTop: 8 }}>
              {creating ? 'Создание...' : 'Создать'}
            </button>
            <button type="button" className="btn" style={{ marginLeft: 8, background: '#6c757d' }} onClick={() => setShowCreate(false)}>
              Отмена
            </button>
          </form>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>У вас пока нет карт</p>
            <button onClick={() => setShowCreate(true)} className="btn" style={{ marginTop: 12 }}>Создать первую карту</button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {cards.map(card => (
            <div key={card.id} className="card" style={{
              background: card.blocked
                ? '#f8f9fa'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: card.blocked ? '#666' : 'white',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {card.blocked && (
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: -30,
                  background: '#dc3545',
                  color: 'white',
                  padding: '4px 40px',
                  transform: 'rotate(45deg)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}>
                  ЗАБЛОКИРОВАНА
                </div>
              )}

              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 4 }}>{card.cardName || 'Карта'}</div>
              <div style={{ fontSize: '1.1rem', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 12 }}>
                {String(card.cardNumber).replace(/(\d{4})(?=\d)/g, '$1 ')}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>
                {Number(card.balance).toLocaleString('ru-RU')} ₽
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {!card.blocked && (
                  <button onClick={() => handleBlock(card.id)} className="btn btn-sm btn-warning" style={{ color: '#333' }}>
                    Заблокировать
                  </button>
                )}
                <button onClick={() => handleDelete(card.id)} className="btn btn-sm btn-danger">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}