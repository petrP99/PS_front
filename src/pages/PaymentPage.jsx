import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPayment, getMyAccounts } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const paymentTypes = {
  mobile: {
    recipient: 'MOBILE_PHONE',
    title: 'Пополнение мобильного телефона',
    destinationLabel: 'Номер телефона',
    destinationPlaceholder: '89XXXXXXXXX',
    successTitle: 'Мобильный телефон успешно пополнен',
  },
  internet: {
    recipient: 'INTERNET',
    title: 'Оплата интернета',
    destinationLabel: 'Номер договора',
    destinationPlaceholder: 'Введите номер договора',
    successTitle: 'Интернет успешно оплачен',
  },
  utilities: {
    recipient: 'UTILITIES',
    title: 'Оплата ЖКХ',
    destinationLabel: 'Номер договора',
    destinationPlaceholder: 'Введите номер договора',
    successTitle: 'Услуги ЖКХ успешно оплачены',
  },
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const { type } = useParams();
  const { user } = useAuth();
  const config = paymentTypes[type];
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [paymentDestination, setPaymentDestination] = useState(
    type === 'mobile' ? normalizePhone(user?.phone) : ''
  );
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  const selectedAccount = useMemo(
    () => accounts.find(account => account.id === accountId),
    [accounts, accountId]
  );

  useEffect(() => {
    if (!config) {
      navigate('/payments', { replace: true });
      return;
    }

    const loadAccounts = async () => {
      try {
        const response = await getMyAccounts();
        const activeAccounts = response.filter(account => account.status === 'ACTIVE');
        setAccounts(activeAccounts);
        setAccountId(activeAccounts[0]?.id || '');
      } catch (error) {
        setToast({ message: error.message || 'Не удалось загрузить счета', visible: true });
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [config, navigate]);

  useEffect(() => {
    if (type === 'mobile' && !paymentDestination && user?.phone) {
      setPaymentDestination(normalizePhone(user.phone));
    }
  }, [paymentDestination, type, user?.phone]);

  const handleSubmit = async event => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!selectedAccount) {
      setToast({ message: 'Выберите счет для оплаты', visible: true });
      return;
    }
    if (!paymentDestination.trim()) {
      setToast({ message: `Укажите ${config.destinationLabel.toLowerCase()}`, visible: true });
      return;
    }
    if (type === 'mobile' && !/^8\d{10}$/.test(paymentDestination)) {
      setToast({ message: 'Введите номер телефона в формате 89XXXXXXXXX', visible: true });
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setToast({ message: 'Укажите сумму больше нуля', visible: true });
      return;
    }

    try {
      setSubmitting(true);
      await createPayment({
        accountId: selectedAccount.id,
        recipient: config.recipient,
        paymentDestination,
        amount: numericAmount,
      });
      setSuccess(true);
      window.setTimeout(() => navigate('/home'), 1500);
    } catch (error) {
      setToast({ message: error.message || 'Не удалось выполнить платеж', visible: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!config) return null;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={headerStyle}>
        <button type="button" onClick={() => navigate('/payments')} style={backButtonStyle}>
          ← Назад
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            {config.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            Выберите счет и заполните данные платежа
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Загрузка счетов...</div>
      ) : success ? (
        <div className="glass" style={successCardStyle}>
          <div style={successIconStyle}>✓</div>
          <h2 style={{ marginBottom: '0.6rem' }}>{config.successTitle}</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)' }}>
            Переходим на главную страницу...
          </p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass" style={emptyCardStyle}>
          <h2 style={{ marginBottom: '0.75rem' }}>Нет активных счетов</h2>
          <button type="button" onClick={() => navigate('/accounts')} style={primaryButtonStyle}>
            Перейти к счетам
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass" style={formStyle}>
          <label style={labelStyle}>
            Счет списания
            <select
              value={accountId}
              onChange={event => setAccountId(event.target.value)}
              style={inputStyle}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} — {formatMoney(account.balance)} {account.currency}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            {config.destinationLabel}
            <input
              type={type === 'mobile' ? 'tel' : 'text'}
              value={paymentDestination}
              onChange={event => setPaymentDestination(
                event.target.value.replace(/\D/g, '').slice(0, type === 'mobile' ? 11 : 30)
              )}
              placeholder={config.destinationPlaceholder}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Сумма
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={event => setAmount(event.target.value)}
                placeholder="0.00"
                style={{ ...inputStyle, paddingRight: '4rem' }}
              />
              <span style={currencyStyle}>{selectedAccount?.currency || ''}</span>
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...primaryButtonStyle,
              width: '100%',
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? 'wait' : 'pointer',
            }}
          >
            {submitting ? 'Оплачиваем...' : 'Оплатить'}
          </button>
        </form>
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ message: '', visible: false })}
      />
    </div>
  );
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  return digits.length === 11 && digits.startsWith('7')
    ? `8${digits.slice(1)}`
    : digits;
}

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '2rem',
};

const formStyle = {
  padding: '2rem',
  maxWidth: '620px',
  borderRadius: '20px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '1.5rem',
  color: 'rgba(255,255,255,0.72)',
  fontSize: '0.9rem',
};

const inputStyle = {
  width: '100%',
  marginTop: '0.5rem',
  padding: '0.8rem 1rem',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  font: 'inherit',
  outline: 'none',
};

const currencyStyle = {
  position: 'absolute',
  right: '1rem',
  top: '0.8rem',
  color: '#a5b4fc',
};

const backButtonStyle = {
  padding: '0.65rem 1rem',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  cursor: 'pointer',
};

const primaryButtonStyle = {
  padding: '0.9rem 1.5rem',
  border: '1px solid rgba(34,197,94,0.4)',
  borderRadius: '12px',
  background: 'rgba(34,197,94,0.2)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const successCardStyle = {
  padding: '2.5rem',
  maxWidth: '620px',
  borderRadius: '20px',
  textAlign: 'center',
};

const successIconStyle = {
  width: '76px',
  height: '76px',
  margin: '0 auto 1.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'rgba(34,197,94,0.14)',
  border: '1px solid rgba(34,197,94,0.4)',
  color: '#86efac',
  fontSize: '2rem',
};

const emptyCardStyle = {
  padding: '2rem',
  maxWidth: '620px',
  borderRadius: '18px',
  textAlign: 'center',
};
