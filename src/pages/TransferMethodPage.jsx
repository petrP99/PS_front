import { useNavigate } from 'react-router-dom';

const methods = [
  {
    path: '/transfers/card',
    icon: '💳',
    title: 'Перевод по карте',
    description: 'Перевод по 16-значному номеру карты',
  },
  {
    path: '/transfers/phone',
    icon: '📱',
    title: 'Перевод по номеру телефона',
    description: 'Рублевый перевод по номеру в формате 89...',
  },
  {
    path: '/transfers/accounts',
    icon: '↔️',
    title: 'Между своими счетами',
    description: 'Мгновенный перевод без комиссии с конвертацией валют',
  },
];

export default function TransferMethodPage() {
  const navigate = useNavigate();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Переводы
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>
          Выберите способ перевода
        </p>
      </div>

      <div className="transfer-method-grid">
        {methods.map(method => (
          <button
            key={method.path}
            type="button"
            onClick={() => navigate(method.path)}
            className="glass"
            style={{
              padding: '2rem',
              border: '1px solid rgba(129,140,248,0.22)',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.035)',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '1.25rem' }}>{method.icon}</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>{method.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              {method.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
