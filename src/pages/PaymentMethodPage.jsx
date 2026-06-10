import { useNavigate } from 'react-router-dom';

const services = [
  {
    path: '/payments/mobile',
    icon: '📱',
    title: 'Мобильный телефон',
    description: 'Пополнение баланса мобильного телефона',
  },
  {
    path: '/payments/internet',
    icon: '🌐',
    title: 'Интернет',
    description: 'Оплата интернета по номеру договора',
  },
  {
    path: '/payments/utilities',
    icon: '🏠',
    title: 'ЖКХ',
    description: 'Оплата услуг ЖКХ по номеру договора',
  },
];

export default function PaymentMethodPage() {
  const navigate = useNavigate();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Оплата услуг
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>
          Выберите услугу для оплаты
        </p>
      </div>

      <div style={serviceGridStyle}>
        {services.map(service => (
          <button
            key={service.path}
            type="button"
            onClick={() => navigate(service.path)}
            className="glass"
            style={serviceCardStyle}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '1.25rem' }}>
              {service.icon}
            </div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>
              {service.title}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              {service.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

const serviceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.25rem',
  maxWidth: '900px',
};

const serviceCardStyle = {
  padding: '2rem',
  border: '1px solid rgba(16,185,129,0.22)',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.035)',
  color: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
};
