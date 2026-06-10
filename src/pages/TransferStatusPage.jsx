import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getTransferById } from '../api';

const terminalStatuses = new Set(['SUCCESS', 'FAILED']);

export default function TransferStatusPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(location.state?.transfer || null);
  const [seconds, setSeconds] = useState(59);
  const [error, setError] = useState('');
  const statusRequestInProgress = useRef(false);

  const refreshStatus = useCallback(async () => {
    if (statusRequestInProgress.current) return null;

    try {
      statusRequestInProgress.current = true;
      const result = await getTransferById(id);
      setTransfer(result);
      setError('');
      return result.status;
    } catch (requestError) {
      setError(
        requestError.status === 404
          ? 'Перевод не найден или недоступен'
          : 'Не удалось обновить статус. Повторим попытку автоматически'
      );
      return null;
    } finally {
      statusRequestInProgress.current = false;
    }
  }, [id]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (terminalStatuses.has(transfer?.status)) return undefined;

    const timer = window.setInterval(() => {
      setSeconds(current => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [transfer?.status]);

  useEffect(() => {
    if (terminalStatuses.has(transfer?.status)) return undefined;

    const polling = window.setInterval(refreshStatus, 1000);
    return () => window.clearInterval(polling);
  }, [refreshStatus, transfer?.status]);

  const status = transfer?.status || 'IN_PROGRESS';
  const isSuccess = status === 'SUCCESS';
  const isFailed = status === 'FAILED';
  const isPending = !isSuccess && !isFailed;
  const progress = Math.max(0, (seconds / 59) * 100);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '720px', margin: '0 auto' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', textAlign: 'center' }}>
        <div style={{
          width: '94px',
          height: '94px',
          margin: '0 auto 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: isSuccess
            ? 'rgba(34,197,94,0.14)'
            : isFailed
              ? 'rgba(244,63,94,0.14)'
              : 'rgba(99,102,241,0.14)',
          border: `1px solid ${isSuccess ? 'rgba(34,197,94,0.4)' : isFailed ? 'rgba(244,63,94,0.4)' : 'rgba(99,102,241,0.4)'}`,
          fontSize: '2.2rem',
          animation: isPending ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}>
          {isSuccess ? '✓' : isFailed ? '×' : seconds}
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
          {isSuccess
            ? 'Перевод выполнен'
            : isFailed
              ? 'Перевод не выполнен'
              : seconds > 0
                ? 'Перевод обрабатывается'
                : 'Обработка заняла больше времени'}
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1.75rem' }}>
          {isSuccess
            ? 'Деньги успешно зачислены получателю'
            : isFailed
              ? 'Списанная сумма возвращена на карту отправителя'
              : seconds > 0
                ? 'Статус обновится автоматически'
                : 'Перевод все еще в работе. Можно оставить эту страницу открытой'}
        </p>

        {isPending && (
          <div style={{
            height: '6px',
            marginBottom: '1.75rem',
            overflow: 'hidden',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.07)',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 'inherit',
              background: 'linear-gradient(90deg, #6366f1, #c084fc)',
              transition: 'width 1s linear',
            }} />
          </div>
        )}

        {transfer && (
          <div style={{
            padding: '1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.035)',
            textAlign: 'left',
          }}>
            <InfoRow label="Сумма перевода" value={`${formatMoney(transfer.amount)} ${transfer.currency}`} />
            {transfer.currency !== transfer.targetCurrency && (
              <>
                <InfoRow
                  label="Курс"
                  value={`1 ${transfer.currency} = ${formatRate(transfer.exchangeRate)} ${transfer.targetCurrency}`}
                />
                <InfoRow
                  label="Комиссия"
                  value={`${formatMoney(transfer.commission)} ${transfer.currency}`}
                />
                <InfoRow
                  label="Списано"
                  value={`${formatMoney(transfer.debitAmount)} ${transfer.currency}`}
                />
                <InfoRow
                  label="К зачислению"
                  value={`${formatMoney(transfer.amountTo)} ${transfer.targetCurrency}`}
                />
              </>
            )}
            <InfoRow label="Получатель" value={transfer.recipient || 'Не указан'} />
            {transfer.recipientPhone ? (
              <InfoRow label="Телефон получателя" value={formatPhone(transfer.recipientPhone)} last />
            ) : (
              <InfoRow label="Карта получателя" value={`•••• ${String(transfer.cardTo).slice(-4)}`} last />
            )}
          </div>
        )}

        {error && (
          <div style={{ color: '#fda4af', marginBottom: '1.25rem' }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isPending && (
            <button type="button" onClick={refreshStatus} style={secondaryButtonStyle}>
              Проверить сейчас
            </button>
          )}
          <button type="button" onClick={() => navigate('/home')} style={secondaryButtonStyle}>
            На главную
          </button>
          <button type="button" onClick={() => navigate('/history')} style={primaryButtonStyle}>
            История переводов
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, last = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.65rem 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
      fontSize: '0.9rem',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span style={{ textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

const primaryButtonStyle = {
  padding: '0.8rem 1.3rem',
  border: '1px solid rgba(129,140,248,0.45)',
  borderRadius: '11px',
  background: 'rgba(99,102,241,0.3)',
  color: '#fff',
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.05)',
};

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

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
}
