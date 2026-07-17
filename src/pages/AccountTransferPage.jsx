import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createAccountTransfer,
  getMyAccounts,
  previewAccountTransfer,
} from '../api';

const currencySigns = {
  RUB: '₽',
  USD: '$',
  CNY: '¥',
};

export default function AccountTransferPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    accountFrom: '',
    accountTo: '',
    amount: '',
  });

  const accountFrom = useMemo(
    () => accounts.find(account => account.id === form.accountFrom),
    [accounts, form.accountFrom]
  );
  const accountTo = useMemo(
    () => accounts.find(account => account.id === form.accountTo),
    [accounts, form.accountTo]
  );

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await getMyAccounts();
        const activeAccounts = response.filter(account => account.status === 'ACTIVE');
        setAccounts(activeAccounts);
        if (activeAccounts.length >= 2) {
          setForm(current => ({
            ...current,
            accountFrom: activeAccounts[0].id,
            accountTo: activeAccounts[1].id,
          }));
        }
      } catch (requestError) {
        setError(getTransferError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  useEffect(() => {
    const amount = Number(form.amount);
    if (
      !form.accountFrom
      || !form.accountTo
      || form.accountFrom === form.accountTo
      || !Number.isFinite(amount)
      || amount <= 0
      || amount > Number(accountFrom?.balance || 0)
    ) {
      setQuote(null);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await previewAccountTransfer({
          accountFrom: form.accountFrom,
          accountTo: form.accountTo,
          amount,
        });
        if (!cancelled) {
          setQuote(response);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setQuote(null);
          setError(getTransferError(requestError));
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accountFrom?.balance, form.accountFrom, form.accountTo, form.amount]);

  const updateField = (field, value) => {
    setError('');
    setQuote(null);
    setForm(current => {
      const updated = { ...current, [field]: value };
      if (field === 'accountFrom' && value === current.accountTo) {
        updated.accountTo = accounts.find(account => account.id !== value)?.id || '';
      }
      return updated;
    });
  };

  const validate = () => {
    const amount = Number(form.amount);
    if (!accountFrom) return 'Выберите счет списания';
    if (!accountTo) return 'Выберите счет зачисления';
    if (accountFrom.id === accountTo.id) return 'Выберите разные счета';
    if (!Number.isFinite(amount) || amount <= 0) return 'Сумма должна быть больше нуля';
    if (!/^\d+([.,]\d{1,2})?$/.test(String(form.amount))) {
      return 'Сумма должна содержать не более двух знаков после запятой';
    }
    if (amount > Number(accountFrom.balance)) return 'Недостаточно средств на счете';
    return '';
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await createAccountTransfer({
        accountFrom: form.accountFrom,
        accountTo: form.accountTo,
        amount: Number(form.amount),
      });
      setResult(response);
    } catch (requestError) {
      setError(getTransferError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка счетов...</div>;
  }

  if (result) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '720px', margin: '0 auto' }}>
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', textAlign: 'center' }}>
          <div style={successIconStyle}>✓</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Перевод выполнен</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1.75rem' }}>
            Деньги сразу зачислены на ваш счет
          </p>
          <div style={detailsStyle}>
            <InfoRow label="Со счета" value={formatAccountName(result.accountFromName, result.accountFrom)} />
            <InfoRow label="На счет" value={formatAccountName(result.accountToName, result.accountTo)} />
            <InfoRow label="Сумма" value={`${formatMoney(result.amount)} ${result.currency}`} />
            {result.currency !== result.targetCurrency && (
              <>
                <InfoRow
                  label="Курс"
                  value={`1 ${result.currency} = ${formatRate(result.exchangeRate)} ${result.targetCurrency}`}
                />
              </>
            )}
            <InfoRow
              label="Зачислено"
              value={`${formatMoney(result.amountTo)} ${result.targetCurrency}`}
              last
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/home')} style={secondaryButtonStyle}>
              На главную
            </button>
            <button type="button" onClick={() => navigate('/accounts')} style={primaryButtonStyle}>
              Мои счета
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Перевод между своими счетами
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>
          Мгновенный перевод без комиссии, в том числе между разными валютами
        </p>
      </div>

      {accounts.length < 2 ? (
        <div className="glass" style={{ padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Недостаточно счетов</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1.25rem' }}>
            Для перевода нужны как минимум два активных счета.
          </p>
          <button type="button" onClick={() => navigate('/accounts')} style={primaryButtonStyle}>
            Перейти к счетам
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: '2rem', borderRadius: '20px', maxWidth: '720px' }}>
          <label style={labelStyle}>
            Счет списания
            <select
              value={form.accountFrom}
              onChange={event => updateField('accountFrom', event.target.value)}
              style={inputStyle}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {formatAccountName(account.name, account.id)} — {formatMoney(account.balance)} {account.currency}
                </option>
              ))}
            </select>
          </label>

          {accountFrom && (
            <div style={balanceStyle}>
              <span>Доступно</span>
              <button
                type="button"
                onClick={() => updateField('amount', Number(accountFrom.balance).toFixed(2))}
                style={maxAmountButtonStyle}
              >
                {formatMoney(accountFrom.balance)} {currencySigns[accountFrom.currency] || accountFrom.currency}
              </button>
            </div>
          )}

          <label style={labelStyle}>
            Счет зачисления
            <select
              value={form.accountTo}
              onChange={event => updateField('accountTo', event.target.value)}
              style={inputStyle}
            >
              {accounts
                .filter(account => account.id !== form.accountFrom)
                .map(account => (
                  <option key={account.id} value={account.id}>
                    {formatAccountName(account.name, account.id)} — {account.currency}
                  </option>
                ))}
            </select>
          </label>

          <label style={labelStyle}>
            Сумма
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={event => updateField('amount', event.target.value)}
                placeholder="0.00"
                style={{ ...inputStyle, paddingRight: '3.5rem' }}
              />
              <span style={{ position: 'absolute', right: '1rem', top: '0.8rem', color: '#a5b4fc' }}>
                {accountFrom?.currency || ''}
              </span>
            </div>
          </label>

          {quote && (
            <div style={quoteStyle}>
              {quote.currency !== quote.targetCurrency && (
                <InfoRow
                  label="Текущий курс"
                  value={`1 ${quote.currency} = ${formatRate(quote.exchangeRate)} ${quote.targetCurrency}`}
                />
              )}
              <InfoRow
                label="Будет зачислено"
                value={`${formatMoney(quote.amountTo)} ${quote.targetCurrency}`}
                last
              />
            </div>
          )}

          {error && <div role="alert" style={errorStyle}>{error}</div>}

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
            {submitting ? 'Выполняем перевод...' : 'Перевести'}
          </button>
        </form>
      )}
    </div>
  );
}

function InfoRow({ label, value, last = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.7rem 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.48)' }}>{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

function getTransferError(error) {
  if (error.status === 400) return error.message || 'Проверьте выбранные счета и сумму';
  if (error.status === 403) return 'Один из счетов вам не принадлежит';
  if (error.status === 404) return error.message || 'Один из счетов не найден';
  if (error.status === 409) return error.message || 'Перевод сейчас невозможен';
  if (error.status >= 500) return 'Сервис переводов временно недоступен';
  return error.message || 'Не удалось выполнить перевод';
}

function formatAccountName(name, id) {
  return name || `Счет ${String(id).slice(-4)}`;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRate(value) {
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

const labelStyle = {
  display: 'block',
  marginBottom: '1.25rem',
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

const balanceStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '0.85rem 1rem',
  marginTop: '-0.5rem',
  marginBottom: '1.25rem',
  borderRadius: '12px',
  background: 'rgba(140,242,155,0.07)',
  color: 'rgba(255,255,255,0.68)',
  fontSize: '0.9rem',
};

const quoteStyle = {
  padding: '0.9rem 1rem',
  marginBottom: '1.25rem',
  border: '1px solid rgba(140,242,155,0.28)',
  borderRadius: '12px',
  background: 'rgba(140,242,155,0.07)',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '0.9rem',
};

const detailsStyle = {
  padding: '1.25rem',
  marginBottom: '1.5rem',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.035)',
  textAlign: 'left',
};

const successIconStyle = {
  width: '94px',
  height: '94px',
  margin: '0 auto 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'rgba(34,197,94,0.14)',
  border: '1px solid rgba(34,197,94,0.4)',
  fontSize: '2.2rem',
};

const errorStyle = {
  padding: '0.9rem 1rem',
  marginBottom: '1.25rem',
  border: '1px solid rgba(244,63,94,0.35)',
  borderRadius: '12px',
  background: 'rgba(244,63,94,0.1)',
  color: '#fda4af',
};

const primaryButtonStyle = {
  padding: '0.85rem 1.5rem',
  border: '1px solid rgba(140,242,155,0.45)',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(140,242,155,0.88), rgba(109,214,255,0.78))',
  color: '#07120c',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.05)',
};

const maxAmountButtonStyle = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: '#a5b4fc',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
};
