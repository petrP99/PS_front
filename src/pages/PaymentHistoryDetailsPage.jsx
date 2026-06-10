import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPaymentById } from '../api';

const statusLabels = {
  SUCCESS: 'Выполнен',
  FAILED: 'Отклонен',
  IN_PROGRESS: 'В обработке',
};

const recipientLabels = {
  MOBILE_PHONE: 'Мобильный телефон',
  INTERNET: 'Интернет',
  UTILITIES: 'ЖКХ',
};

export default function PaymentHistoryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPayment = async () => {
      try {
        setPayment(await getPaymentById(id));
      } catch (requestError) {
        setError(
          requestError.status === 404
            ? 'Платеж не найден или недоступен'
            : 'Не удалось загрузить информацию о платеже'
        );
      }
    };

    loadPayment();
  }, [id]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '720px', margin: '0 auto' }}>
      <button type="button" onClick={() => navigate('/history')} style={backButtonStyle}>
        ← Назад к истории
      </button>

      <div className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>
          Информация о платеже
        </h1>

        {error ? (
          <div style={{ color: '#fda4af', textAlign: 'center', padding: '2rem' }}>{error}</div>
        ) : !payment ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>
            Загрузка...
          </div>
        ) : (
          <PaymentDetails payment={payment} />
        )}
      </div>
    </div>
  );
}

function PaymentDetails({ payment }) {
  return (
    <div>
      <DetailRow
        label="Сумма"
        value={`−${formatMoney(payment.amount)} ${payment.currency || ''}`}
        valueColor={payment.status === 'FAILED' ? '#f87171' : '#fff'}
      />
      <DetailRow
        label="Статус"
        value={statusLabels[payment.status] || payment.status}
        valueColor={getStatusColor(payment.status)}
      />
      <DetailRow label="Дата и время" value={formatDateTime(payment.timeOfPay)} />
      <DetailRow label="Услуга" value={recipientLabels[payment.recipient] || payment.recipient} />
      <DetailRow
        label={payment.recipient === 'MOBILE_PHONE' ? 'Номер телефона' : 'Номер договора'}
        value={formatDestination(payment)}
      />
      <DetailRow
        label="Счет списания"
        value={payment.accountName || `Счет ${String(payment.accountId || '').slice(-4)}`}
      />
      <DetailRow label="Валюта" value={payment.currency || 'Не указана'} last />
    </div>
  );
}

function DetailRow({ label, value, valueColor, last = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.8rem 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
      fontSize: '0.9rem',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <strong style={{ color: valueColor || '#fff', textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

function formatDestination(payment) {
  if (payment.recipient !== 'MOBILE_PHONE') return payment.paymentDestination;
  const digits = String(payment.paymentDestination || '').replace(/\D/g, '');
  return digits.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
}

function getStatusColor(status) {
  if (status === 'SUCCESS') return '#86efac';
  if (status === 'FAILED') return '#f87171';
  return '#a5b4fc';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const backButtonStyle = {
  marginBottom: '1rem',
  padding: '0.65rem 1rem',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  cursor: 'pointer',
};
