import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTransferHistoryById } from '../api';

const statusLabels = {
  SUCCESS: 'Выполнен',
  FAILED: 'Отклонен',
  IN_PROGRESS: 'В обработке',
};

export default function TransferHistoryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTransfer = async () => {
      try {
        setTransfer(await getTransferHistoryById(id));
      } catch (requestError) {
        setError(
          requestError.status === 404
            ? 'Перевод не найден или недоступен'
            : 'Не удалось загрузить информацию о переводе'
        );
      }
    };

    loadTransfer();
  }, [id]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '720px', margin: '0 auto' }}>
      <button type="button" onClick={() => navigate('/history')} style={backButtonStyle}>
        ← Назад к истории
      </button>

      <div className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>
          Информация о переводе
        </h1>

        {error ? (
          <div style={{ color: '#fda4af', textAlign: 'center', padding: '2rem' }}>{error}</div>
        ) : !transfer ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>
            Загрузка...
          </div>
        ) : (
          <TransferDetails transfer={transfer} />
        )}
      </div>
    </div>
  );
}

function TransferDetails({ transfer }) {
  if (transfer.operationType === 'ACCOUNT') {
    return <AccountTransferDetails transfer={transfer} />;
  }

  const incoming = transfer.incoming;
  const isExchange = transfer.currency !== transfer.targetCurrency;
  const displayAmount = incoming
    ? `${formatMoney(transfer.amountTo ?? transfer.amount)} ${transfer.targetCurrency ?? transfer.currency}`
    : `${formatMoney(transfer.debitAmount ?? transfer.amount)} ${transfer.currency}`;

  return (
    <div>
      <DetailRow
        label="Сумма"
        value={`${incoming ? '+' : '−'}${displayAmount}`}
        valueColor={transfer.status === 'FAILED' ? '#f87171' : incoming ? '#4ade80' : '#fff'}
      />
      <DetailRow label="Статус" value={statusLabels[transfer.status] || transfer.status} valueColor={getStatusColor(transfer.status)} />
      <DetailRow label="Дата и время" value={formatDateTime(transfer.timeOfTransfer)} />
      <DetailRow label="Направление" value={incoming ? 'Входящий перевод' : 'Исходящий перевод'} />
      <DetailRow label={incoming ? 'От кого' : 'Кому'} value={transfer.counterparty || 'Не указано'} />
      <DetailRow label="Карта отправителя" value={`•••• ${String(transfer.cardFrom).slice(-4)}`} />
      <DetailRow label="Карта получателя" value={`•••• ${String(transfer.cardTo).slice(-4)}`} />
      {!incoming && transfer.recipientPhone && (
        <DetailRow label="Телефон получателя" value={formatPhone(transfer.recipientPhone)} />
      )}
      <DetailRow label="Сумма перевода" value={`${formatMoney(transfer.amount)} ${transfer.currency}`} />
      {isExchange && (
        <>
          <DetailRow
            label="Курс"
            value={`1 ${transfer.currency} = ${formatRate(transfer.exchangeRate)} ${transfer.targetCurrency}`}
          />
          <DetailRow label="Комиссия" value={`${formatMoney(transfer.commission)} ${transfer.currency}`} />
          <DetailRow label="Списано" value={`${formatMoney(transfer.debitAmount)} ${transfer.currency}`} />
          <DetailRow label="Зачислено" value={`${formatMoney(transfer.amountTo)} ${transfer.targetCurrency}`} />
        </>
      )}
      <DetailRow label="Сообщение" value={transfer.message || 'Без сообщения'} last />
    </div>
  );
}

function AccountTransferDetails({ transfer }) {
  const isExchange = transfer.currency !== transfer.targetCurrency;

  return (
    <div>
      <DetailRow
        label="Сумма"
        value={`−${formatMoney(transfer.amount)} ${transfer.currency}`}
      />
      <DetailRow label="Статус" value="Выполнен" valueColor="#86efac" />
      <DetailRow label="Дата и время" value={formatDateTime(transfer.timeOfTransfer)} />
      <DetailRow label="Тип перевода" value="Между своими счетами" />
      <DetailRow
        label="Со счета"
        value={formatAccountName(transfer.accountFromName, transfer.accountFrom)}
      />
      <DetailRow
        label="На счет"
        value={formatAccountName(transfer.accountToName, transfer.accountTo)}
      />
      <DetailRow label="Сумма перевода" value={`${formatMoney(transfer.amount)} ${transfer.currency}`} />
      {isExchange && (
        <DetailRow
          label="Курс"
          value={`1 ${transfer.currency} = ${formatRate(transfer.exchangeRate)} ${transfer.targetCurrency}`}
        />
      )}
      <DetailRow label="Комиссия" value={`0,00 ${transfer.currency}`} />
      <DetailRow
        label="Зачислено"
        value={`${formatMoney(transfer.amountTo)} ${transfer.targetCurrency}`}
        last
      />
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

const backButtonStyle = {
  marginBottom: '1rem',
  padding: '0.65rem 1rem',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  cursor: 'pointer',
};

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

function formatRate(value) {
  return Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
}

function formatAccountName(name, id) {
  return name || `Счет ${String(id || '').slice(-4)}`;
}
