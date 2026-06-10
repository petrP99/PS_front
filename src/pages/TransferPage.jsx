import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createPhoneTransfer,
  createTransfer,
  getTransferCards,
  previewPhoneTransfer,
  previewTransfer,
} from '../api';
import { getCardLastFour } from '../utils/cardFormat';

const currencyNames = {
  RUB: '₽',
  USD: '$',
  CNY: '¥',
};

function getTransferError(error) {
  if (error.status === 400) return error.message || 'Проверьте номер карты и сумму перевода';
  if (error.status === 403) return 'Выбранная карта вам не принадлежит';
  if (error.status === 404) return error.message || 'Одна из карт не найдена';
  if (error.status === 409) return error.message || 'Перевод сейчас невозможен';
  if (error.status >= 500) return 'Сервис переводов временно недоступен. Попробуйте позже';
  return error.message || 'Не удалось создать перевод';
}

export default function TransferPage({ mode = 'card' }) {
  const navigate = useNavigate();
  const isPhoneTransfer = mode === 'phone';
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    cardFrom: '',
    cardTo: '',
    phone: '',
    amount: '',
    message: '',
  });

  const selectedCard = useMemo(
    () => cards.find(card => card.cardNumber === form.cardFrom),
    [cards, form.cardFrom]
  );

  const maxTransferAmount = useMemo(() => {
    if (!selectedCard || !quote || quote.currency === quote.targetCurrency) return null;
    return calculateMaxTransferAmount(selectedCard.balance, quote.commissionPercent);
  }, [quote, selectedCard]);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const result = await getTransferCards();
        const activeCards = result.filter(card =>
          card.status === 'ACTIVE' && (!isPhoneTransfer || card.currency === 'RUB')
        );
        setCards(activeCards);
        if (activeCards.length > 0) {
          setForm(current => ({ ...current, cardFrom: activeCards[0].cardNumber }));
        }
      } catch (loadError) {
        setError(getTransferError(loadError));
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [isPhoneTransfer]);

  useEffect(() => {
    const recipientIsValid = isPhoneTransfer
      ? /^8\d{10}$/.test(form.phone)
      : /^\d{16}$/.test(form.cardTo) && form.cardTo !== form.cardFrom;
    const canLoadQuote = selectedCard
      && recipientIsValid
      && Number(selectedCard.balance) >= 0.01;

    if (!canLoadQuote) {
      setQuote(null);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = isPhoneTransfer
          ? await previewPhoneTransfer({
              cardFrom: form.cardFrom,
              phone: form.phone,
              amount: 0.01,
            })
          : await previewTransfer({
              cardFrom: form.cardFrom,
              cardTo: form.cardTo,
              amount: 0.01,
            });
        if (!cancelled) setQuote(result);
      } catch {
        if (!cancelled) setQuote(null);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.cardFrom, form.cardTo, form.phone, isPhoneTransfer, selectedCard]);

  const updateField = (field, value) => {
    setError('');
    setPreview(null);
    if (field === 'cardFrom' || field === 'cardTo' || field === 'phone') {
      setQuote(null);
    }
    setForm(current => ({ ...current, [field]: value }));
  };

  const validate = () => {
    const amount = Number(form.amount);
    if (!selectedCard) return 'Выберите карту списания';
    if (isPhoneTransfer) {
      if (!/^8\d{10}$/.test(form.phone)) {
        return 'Введите 11 цифр номера телефона, начиная с 8';
      }
    } else {
      if (!/^\d{16}$/.test(form.cardTo)) return 'Введите 16 цифр номера карты получателя';
      if (form.cardTo === form.cardFrom) return 'Нельзя перевести деньги на ту же карту';
    }
    if (!Number.isFinite(amount) || amount <= 0) return 'Сумма должна быть больше нуля';
    if (amount > Number(selectedCard.balance)) return 'На карте недостаточно средств';
    if (maxTransferAmount !== null && amount > maxTransferAmount) {
      return `С учетом комиссии можно перевести не более ${formatMoney(maxTransferAmount)} ${selectedCard.currency}`;
    }
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
      const request = {
        cardFrom: form.cardFrom,
        amount: Number(form.amount),
        message: form.message.trim() || undefined,
      };
      const result = isPhoneTransfer
        ? await previewPhoneTransfer({ ...request, phone: form.phone })
        : await previewTransfer({ ...request, cardTo: form.cardTo });
      setPreview(result);
    } catch (submitError) {
      setError(getTransferError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;

    try {
      setSubmitting(true);
      setError('');
      const request = {
        cardFrom: preview.cardFrom,
        amount: preview.amount,
        message: preview.message || undefined,
      };
      const transfer = isPhoneTransfer
        ? await createPhoneTransfer({ ...request, phone: preview.recipientPhone })
        : await createTransfer({ ...request, cardTo: preview.cardTo });
      navigate(`/transfers/${transfer.id}`, { state: { transfer } });
    } catch (submitError) {
      setError(getTransferError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка карт...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {isPhoneTransfer ? 'Перевод по номеру телефона' : 'Перевод с карты на карту'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>
          {isPhoneTransfer
            ? 'Переводы доступны только в рублях и с рублевой карты'
            : 'Переводы доступны между картами в одинаковых и разных валютах'}
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="glass" style={{ padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>
            {isPhoneTransfer ? 'Нет активных рублевых карт' : 'Нет активных карт'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1.25rem' }}>
            {isPhoneTransfer
              ? 'Для перевода по телефону нужна активная рублевая карта.'
              : 'Для перевода нужна хотя бы одна активная карта.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/cards')}
            style={primaryButtonStyle}
          >
            Перейти к картам
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="glass"
          style={{ padding: '2rem', borderRadius: '20px', maxWidth: '720px' }}
        >
          {!preview ? (
            <>
              <label style={labelStyle}>
                Карта списания
                <select
                  value={form.cardFrom}
                  onChange={event => updateField('cardFrom', event.target.value)}
                  style={inputStyle}
                >
                  {cards.map(card => (
                    <option key={card.id} value={card.cardNumber}>
                      {card.name || 'Карта'} •••• {getCardLastFour(card.cardNumber)}
                      {' — '}
                      {Number(card.balance).toLocaleString('ru-RU')} {card.currency}
                    </option>
                  ))}
                </select>
              </label>

              {selectedCard && (
                <div style={{
                  padding: '0.85rem 1rem',
                  marginTop: '-0.5rem',
                  marginBottom: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(99,102,241,0.09)',
                  color: 'rgba(255,255,255,0.68)',
                  fontSize: '0.9rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span>Доступно</span>
                    <strong style={{ color: '#a5b4fc' }}>
                      {formatMoney(selectedCard.balance)} {currencyNames[selectedCard.currency] || selectedCard.currency}
                    </strong>
                  </div>
                  {maxTransferAmount !== null && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      marginTop: '0.65rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid rgba(165,180,252,0.16)',
                    }}>
                      <span>Максимум для перевода с комиссией</span>
                      <button
                        type="button"
                        onClick={() => updateField('amount', maxTransferAmount.toFixed(2))}
                        style={maxAmountButtonStyle}
                      >
                        {formatMoney(maxTransferAmount)} {selectedCard.currency}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isPhoneTransfer ? (
                <label style={labelStyle}>
                  Номер телефона получателя
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={formatPhoneInput(form.phone)}
                    onChange={event => updateField('phone', event.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="8 900 000 00 00"
                    style={inputStyle}
                  />
                </label>
              ) : (
                <label style={labelStyle}>
                  Номер карты получателя
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={form.cardTo.replace(/(\d{4})(?=\d)/g, '$1 ')}
                    onChange={event => updateField('cardTo', event.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="0000 0000 0000 0000"
                    style={inputStyle}
                  />
                </label>
              )}

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
                    {selectedCard?.currency || ''}
                  </span>
                </div>
              </label>

              <label style={labelStyle}>
                Сообщение
                <input
                  type="text"
                  maxLength="120"
                  value={form.message}
                  onChange={event => updateField('message', event.target.value)}
                  placeholder="Необязательно"
                  style={inputStyle}
                />
              </label>

              {quote && quote.currency !== quote.targetCurrency && (
                <div style={{
                  padding: '0.9rem 1rem',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(99,102,241,0.28)',
                  borderRadius: '12px',
                  background: 'rgba(99,102,241,0.09)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',
                }}>
                  Курс: 1 {quote.currency} = {formatRate(quote.exchangeRate)} {quote.targetCurrency}
                  {' · '}
                  Комиссия: {formatRate(quote.commissionPercent)}%
                  {Number(form.amount) > 0 && (
                    <> ({formatMoney(calculateCommission(form.amount, quote.commissionPercent))} {quote.currency})</>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
                Подтверждение перевода
              </h2>
              <div style={{
                padding: '1.25rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.035)',
              }}>
                <PreviewRow label="Получатель" value={preview.recipient} />
                <PreviewRow
                  label="Карта списания"
                  value={`•••• ${String(preview.cardFrom).slice(-4)}`}
                />
                {isPhoneTransfer ? (
                  <PreviewRow
                    label="Телефон получателя"
                    value={formatPhoneInput(preview.recipientPhone)}
                  />
                ) : (
                  <PreviewRow
                    label="Карта получателя"
                    value={`•••• ${String(preview.cardTo).slice(-4)}`}
                  />
                )}
                <PreviewRow
                  label="Сумма перевода"
                  value={`${Number(preview.amount).toLocaleString('ru-RU')} ${preview.currency}`}
                />
                {preview.currency !== preview.targetCurrency && (
                  <>
                    <PreviewRow
                      label="Курс"
                      value={`1 ${preview.currency} = ${formatRate(preview.exchangeRate)} ${preview.targetCurrency}`}
                    />
                    <PreviewRow
                      label={`Комиссия (${formatRate(preview.commissionPercent)}%)`}
                      value={`${formatMoney(preview.commission)} ${preview.currency}`}
                    />
                    <PreviewRow
                      label="К списанию"
                      value={`${formatMoney(preview.debitAmount)} ${preview.currency}`}
                    />
                    <PreviewRow
                      label="Получатель получит"
                      value={`${formatMoney(preview.amountTo)} ${preview.targetCurrency}`}
                    />
                  </>
                )}
                <PreviewRow
                  label="Сообщение"
                  value={preview.message || 'Без сообщения'}
                  last
                />
              </div>
              <p style={{
                marginTop: '1rem',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
              }}>
                Проверьте данные. После подтверждения будет списано{' '}
                {formatMoney(preview.debitAmount)} {preview.currency}.
              </p>
            </div>
          )}

          {error && (
            <div role="alert" style={{
              padding: '0.9rem 1rem',
              marginBottom: '1.25rem',
              border: '1px solid rgba(244,63,94,0.35)',
              borderRadius: '12px',
              background: 'rgba(244,63,94,0.1)',
              color: '#fda4af',
            }}>
              {error}
            </div>
          )}

          {!preview ? (
            <button type="submit" disabled={submitting} style={{
              ...primaryButtonStyle,
              width: '100%',
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? 'wait' : 'pointer',
            }}>
              {submitting ? 'Проверяем данные...' : 'Перевести'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setError('');
                }}
                disabled={submitting}
                style={{ ...secondaryButtonStyle, flex: 1 }}
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                style={{
                  ...primaryButtonStyle,
                  flex: 1,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? 'wait' : 'pointer',
                }}
              >
                {submitting ? 'Создаем перевод...' : 'Подтвердить'}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
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

const primaryButtonStyle = {
  padding: '0.85rem 1.5rem',
  border: '1px solid rgba(129,140,248,0.45)',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(168,85,247,0.85))',
  color: '#fff',
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
  textAlign: 'right',
};

function PreviewRow({ label, value, last = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.75rem 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.48)' }}>{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU', {
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

function calculateCommission(amount, commissionPercent) {
  const amountCents = Math.round(Number(amount) * 100);
  return Math.round(amountCents * Number(commissionPercent) / 100) / 100;
}

function calculateMaxTransferAmount(balance, commissionPercent) {
  const balanceCents = Math.floor((Number(balance) + Number.EPSILON) * 100);
  const percent = Number(commissionPercent);
  let amountCents = Math.floor(balanceCents / (1 + percent / 100));
  const debitCents = cents => cents + Math.round(cents * percent / 100);

  while (amountCents > 0 && debitCents(amountCents) > balanceCents) {
    amountCents -= 1;
  }
  while (debitCents(amountCents + 1) <= balanceCents) {
    amountCents += 1;
  }

  return amountCents / 100;
}

function formatPhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 1) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
  if (digits.length <= 7) return `${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return `${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
}
