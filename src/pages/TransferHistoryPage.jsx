import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCashbackAccruals,
  getCurrencyRates,
  getMyAccounts,
  getPayments,
  getReplenishments,
  getTransferHistory,
} from '../api';

const sections = [
  { id: 'all', title: 'Все операции', description: 'Полная история операций' },
  { id: 'payments', title: 'Платежи', description: 'История платежей' },
  { id: 'transfers', title: 'Переводы', description: 'Входящие и исходящие переводы' },
  { id: 'replenishments', title: 'Пополнения', description: 'Зачисления на ваши счета' },
];

const balanceChartPeriods = [
  { id: 'day', label: 'День', subtitle: 'Общий баланс в рублях по часам за сегодня' },
  { id: 'week', label: 'Неделя', subtitle: 'Общий баланс в рублях по дням за последние 7 дней' },
];

export default function TransferHistoryPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('all');
  const [balanceChartPeriod, setBalanceChartPeriod] = useState('day');
  const [reportNoticeOpen, setReportNoticeOpen] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cashbackAccruals, setCashbackAccruals] = useState([]);
  const [replenishments, setReplenishments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [replenishmentsLoading, setReplenishmentsLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentsError, setPaymentsError] = useState('');
  const [cashbackError, setCashbackError] = useState('');
  const [replenishmentsError, setReplenishmentsError] = useState('');
  const [balanceError, setBalanceError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await getTransferHistory();
        setTransfers(Array.isArray(result?.content) ? result.content : []);
      } catch (requestError) {
        setError(requestError.message || 'Не удалось загрузить историю переводов');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    const loadPayments = async () => {
      try {
        const result = await getPayments();
        setPayments(Array.isArray(result?.content) ? result.content : []);
      } catch (requestError) {
        setPaymentsError(requestError.message || 'Не удалось загрузить историю платежей');
      } finally {
        setPaymentsLoading(false);
      }
    };

    loadPayments();

    const loadCashback = async () => {
      try {
        const result = await getCashbackAccruals();
        setCashbackAccruals(Array.isArray(result) ? result : []);
        setCashbackError('');
      } catch (requestError) {
        setCashbackError(requestError.message || 'Не удалось загрузить данные кешбэка');
      }
    };

    loadCashback();

    const loadReplenishments = async () => {
      try {
        const result = await getReplenishments();
        setReplenishments(Array.isArray(result) ? result : []);
      } catch (requestError) {
        setReplenishmentsError(requestError.message || 'Не удалось загрузить историю пополнений');
      } finally {
        setReplenishmentsLoading(false);
      }
    };

    loadReplenishments();

    const loadBalanceData = async () => {
      try {
        const [accountsResult, ratesResult] = await Promise.all([
          getMyAccounts(),
          getCurrencyRates(),
        ]);
        setAccounts(Array.isArray(accountsResult) ? accountsResult : []);
        setRates(ratesResult);
      } catch (requestError) {
        setBalanceError(requestError.message || 'Не удалось рассчитать динамику баланса');
      } finally {
        setBalanceLoading(false);
      }
    };

    loadBalanceData();

    window.addEventListener('focus', loadCashback);
    return () => {
      window.removeEventListener('focus', loadCashback);
    };
  }, []);

  const cashbackByPaymentId = useMemo(
    () => buildCashbackByPaymentId(cashbackAccruals),
    [cashbackAccruals]
  );
  const groupedTransfers = useMemo(() => groupTransfersByDate(transfers), [transfers]);
  const groupedPayments = useMemo(() => groupPaymentsByDate(payments), [payments]);
  const groupedReplenishments = useMemo(
    () => groupReplenishmentsByDate(replenishments),
    [replenishments]
  );
  const allOperations = useMemo(
    () => buildAllOperations(transfers, payments, replenishments, cashbackByPaymentId),
    [transfers, payments, replenishments, cashbackByPaymentId]
  );
  const groupedOperations = useMemo(
    () => groupOperationsByDate(allOperations),
    [allOperations]
  );
  const allLoading = loading || paymentsLoading || replenishmentsLoading;
  const allErrors = [error, paymentsError, replenishmentsError].filter(Boolean);
  const balanceHistory = useMemo(
    () => buildBalanceHistory(accounts, rates, transfers, payments, replenishments, balanceChartPeriod),
    [accounts, rates, transfers, payments, replenishments, balanceChartPeriod]
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            История
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            Ваши финансовые операции
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReportNoticeOpen(true)}
          style={reportButtonStyle}
        >
          Сгенерировать отчет
        </button>
      </div>

      <BalanceHistoryChart
        points={balanceHistory}
        loading={balanceLoading || allLoading}
        error={balanceError}
        period={balanceChartPeriod}
        onPeriodChange={setBalanceChartPeriod}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {sections.map(section => {
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className="glass"
              style={{
                padding: '1.25rem',
                border: active
                  ? '1px solid rgba(129,140,248,0.55)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                background: active ? 'rgba(99,102,241,0.16)' : 'rgba(255,255,255,0.035)',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{section.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                {section.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        {activeSection === 'all' ? (
          allLoading ? (
            <EmptyState>Загрузка истории...</EmptyState>
          ) : allOperations.length === 0 ? (
            <EmptyState color={allErrors.length > 0 ? '#fda4af' : undefined}>
              {allErrors[0] || 'История операций пуста'}
            </EmptyState>
          ) : (
            <>
              {allErrors.length > 0 && (
                <div style={historyWarningStyle}>
                  Часть операций не удалось загрузить
                </div>
              )}
              {cashbackError && (
                <div style={historyWarningStyle}>
                  {cashbackError}
                </div>
              )}
              <AllOperationGroups
                groups={groupedOperations}
                onSelect={operation => operation.path && navigate(operation.path)}
              />
            </>
          )
        ) : activeSection === 'payments' ? (
          paymentsLoading ? (
            <EmptyState>Загрузка истории...</EmptyState>
          ) : paymentsError ? (
            <EmptyState color="#fda4af">{paymentsError}</EmptyState>
          ) : payments.length === 0 ? (
            <EmptyState>История платежей пуста</EmptyState>
          ) : (
            <>
              {cashbackError && (
                <div style={historyWarningStyle}>
                  {cashbackError}
                </div>
              )}
              <PaymentGroups
                groups={groupedPayments}
                cashbackByPaymentId={cashbackByPaymentId}
                onSelect={payment => navigate(`/history/payments/${payment.id}`)}
              />
            </>
          )
        ) : activeSection === 'replenishments' ? (
          replenishmentsLoading ? (
            <EmptyState>Загрузка истории...</EmptyState>
          ) : replenishmentsError ? (
            <EmptyState color="#fda4af">{replenishmentsError}</EmptyState>
          ) : replenishments.length === 0 ? (
            <EmptyState>История пополнений пуста</EmptyState>
          ) : (
            <ReplenishmentGroups groups={groupedReplenishments} />
          )
        ) : loading ? (
          <EmptyState>Загрузка истории...</EmptyState>
        ) : error ? (
          <EmptyState color="#fda4af">{error}</EmptyState>
        ) : transfers.length === 0 ? (
          <EmptyState>История переводов пуста</EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {groupedTransfers.map(group => (
              <section key={group.key}>
                <h2 style={{
                  marginBottom: '0.75rem',
                  color: 'rgba(255,255,255,0.48)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  {group.label}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {group.transfers.map(transfer => {
                    const amount = getDisplayAmount(transfer);
                    return (
                      <button
                        key={transfer.id}
                        type="button"
                        onClick={() => navigate(`/history/transfers/${transfer.id}`)}
                        style={{
                          width: '100%',
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr) auto',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem 1.1rem',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '14px',
                          background: 'rgba(255,255,255,0.035)',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={operationInfoStyle}>
                          <OperationIcon type="transfer" />
                          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {transfer.operationType === 'ACCOUNT'
                              ? 'Между своими счетами'
                              : transfer.counterparty || 'Контрагент не указан'}
                          </span>
                        </div>
                        <strong style={{ color: getAmountColor(transfer), whiteSpace: 'nowrap' }}>
                          {transfer.operationType === 'ACCOUNT' ? '−' : transfer.incoming ? '+' : '−'}
                          {formatMoney(amount.value)} {amount.currency}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {reportNoticeOpen && (
        <div
          role="presentation"
          onClick={() => setReportNoticeOpen(false)}
          style={modalOverlayStyle}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-notice-title"
            onClick={event => event.stopPropagation()}
            className="glass"
            style={modalStyle}
          >
            <h2 id="report-notice-title" style={{ marginBottom: '0.8rem' }}>
              Генерация отчета
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              Функционал находится в разработке, пока идите нахуй
            </p>
            <button
              type="button"
              onClick={() => setReportNoticeOpen(false)}
              style={modalButtonStyle}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BalanceHistoryChart({ points, loading, error, period, onPeriodChange }) {
  const activePeriod = balanceChartPeriods.find(item => item.id === period) || balanceChartPeriods[0];
  const header = (
    <div style={chartHeaderStyle}>
      <div>
        <h2 style={chartTitleStyle}>Динамика баланса</h2>
        <p style={chartSubtitleStyle}>{activePeriod.subtitle}</p>
      </div>
      <div style={chartPeriodToggleStyle} aria-label="Период графика баланса">
        {balanceChartPeriods.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPeriodChange(item.id)}
            style={getChartPeriodButtonStyle(item.id === period)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="glass" style={chartCardStyle}>
        {header}
        <EmptyState>Рассчитываем динамику баланса...</EmptyState>
      </div>
    );
  }

  if (error || points.length === 0) {
    return (
      <div className="glass" style={chartCardStyle}>
        {header}
        <div style={{ color: '#fda4af', padding: '2rem 0', textAlign: 'center' }}>
          {error || 'Недостаточно данных для построения графика'}
        </div>
      </div>
    );
  }

  const width = 820;
  const height = 270;
  const padding = { top: 25, right: 20, bottom: 42, left: 76 };
  const values = points.map(point => point.balance);
  const rawMinValue = Math.min(...values);
  const rawMaxValue = Math.max(...values);
  const flatPadding = rawMinValue === rawMaxValue
    ? Math.max(Math.abs(rawMaxValue) * 0.05, 1)
    : 0;
  const minValue = rawMinValue - flatPadding;
  const maxValue = rawMaxValue + flatPadding;
  const range = maxValue - minValue;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const coordinates = points.map((point, index) => ({
    ...point,
    x: padding.left + (index / Math.max(points.length - 1, 1)) * chartWidth,
    y: padding.top + ((maxValue - point.balance) / range) * chartHeight,
  }));
  const linePoints = coordinates.map(point => `${point.x},${point.y}`).join(' ');
  const areaPath = [
    `M ${coordinates[0].x} ${padding.top + chartHeight}`,
    ...coordinates.map(point => `L ${point.x} ${point.y}`),
    `L ${coordinates[coordinates.length - 1].x} ${padding.top + chartHeight}`,
    'Z',
  ].join(' ');
  const currentBalance = values[values.length - 1];
  const balanceChange = currentBalance - values[0];
  const labelIndexes = getChartLabelIndexes(points.length);
  const yLabels = [maxValue, minValue + range / 2, minValue];

  return (
    <div className="glass" style={chartCardStyle}>
      <div style={chartHeaderStyle}>
        <div>
          <h2 style={chartTitleStyle}>Динамика баланса</h2>
          <p style={chartSubtitleStyle}>{activePeriod.subtitle}</p>
        </div>
        <div style={chartHeaderRightStyle}>
          <div style={chartPeriodToggleStyle} aria-label="Период графика баланса">
            {balanceChartPeriods.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPeriodChange(item.id)}
                style={getChartPeriodButtonStyle(item.id === period)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong style={{ display: 'block', fontSize: '1.25rem' }}>
              {formatMoney(currentBalance)} ₽
            </strong>
            <span style={{
              color: balanceChange >= 0 ? '#4ade80' : '#f87171',
              fontSize: '0.82rem',
            }}>
              {balanceChange >= 0 ? '+' : '−'}{formatMoney(Math.abs(balanceChange))} ₽ за период
            </span>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`График изменения общего баланса: ${activePeriod.label.toLowerCase()}`}
          style={{ width: '100%', minWidth: '620px', display: 'block' }}
        >
          <defs>
            <linearGradient id="balanceAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {yLabels.map((label, index) => {
            const y = padding.top + (index / 2) * chartHeight;
            return (
              <g key={`${label}-${index}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  fill="rgba(255,255,255,0.42)"
                  fontSize="11"
                  textAnchor="end"
                >
                  {formatCompactMoney(label)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#balanceAreaGradient)" />
          <polyline
            points={linePoints}
            fill="none"
            stroke="#4ade80"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {coordinates.map(point => (
            <circle
              key={point.key}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="#0a0a0f"
              stroke="#86efac"
              strokeWidth="2"
            >
              <title>{`${formatChartDate(point.date, period)}: ${formatMoney(point.balance)} ₽`}</title>
            </circle>
          ))}

          {labelIndexes.map(index => {
            const point = coordinates[index];
            return (
              <text
                key={point.key}
                x={point.x}
                y={height - 14}
                fill="rgba(255,255,255,0.42)"
                fontSize="11"
                textAnchor="middle"
              >
                {formatChartDate(point.date, period)}
              </text>
            );
          })}
        </svg>
      </div>

      <p style={chartNoteStyle}>
        Валютные счета пересчитаны по текущему курсу. Учитываются успешные операции.
      </p>
    </div>
  );
}

function AllOperationGroups({ groups, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {groups.map(group => (
        <section key={group.key}>
          <h2 style={groupTitleStyle}>{group.label}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {group.operations.map(operation => {
              const Component = operation.path ? 'button' : 'div';
              return (
                <Component
                  key={`${operation.type}-${operation.id}`}
                  type={operation.path ? 'button' : undefined}
                  onClick={operation.path ? () => onSelect(operation) : undefined}
                  style={{
                    ...allOperationStyle,
                    cursor: operation.path ? 'pointer' : 'default',
                  }}
                >
                  <div style={operationInfoStyle}>
                    <OperationIcon type={operation.type} recipient={operation.recipient} />
                    <div style={{ minWidth: 0 }}>
                      <div style={operationTitleStyle}>{operation.title}</div>
                      <div style={operationPurposeStyle}>{operation.purpose}</div>
                    </div>
                  </div>
                  <div style={operationAmountGroupStyle}>
                    {hasCashback(operation) && (
                      <span style={cashbackChipStyle}>
                        +{formatCashbackBadge(operation.cashbackAmount)}
                      </span>
                    )}
                    <strong style={{
                      color: getOperationAmountColor(operation),
                      whiteSpace: 'nowrap',
                    }}>
                      {operation.sign}{formatMoney(operation.amount)} {operation.currency || ''}
                    </strong>
                  </div>
                </Component>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function PaymentGroups({ groups, cashbackByPaymentId, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {groups.map(group => (
        <section key={group.key}>
          <h2 style={groupTitleStyle}>{group.label}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {group.payments.map(payment => {
              const cashback = cashbackByPaymentId.get(String(payment.id));
              return (
                <button
                  key={payment.id}
                  type="button"
                  onClick={() => onSelect(payment)}
                  style={operationButtonStyle}
                >
                  <div style={operationInfoStyle}>
                    <OperationIcon type="payment" recipient={payment.recipient} />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getPaymentRecipientLabel(payment.recipient)}
                    </span>
                  </div>
                  <div style={operationAmountGroupStyle}>
                    {cashback && (
                      <span style={cashbackChipStyle}>
                        +{formatCashbackBadge(cashback.cashbackAmount)}
                      </span>
                    )}
                    <strong style={{
                      color: payment.status === 'FAILED' ? '#f87171' : '#fff',
                      whiteSpace: 'nowrap',
                    }}>
                      −{formatMoney(payment.amount)} {payment.currency || ''}
                    </strong>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function ReplenishmentGroups({ groups }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {groups.map(group => (
        <section key={group.key}>
          <h2 style={{
            marginBottom: '0.75rem',
            color: 'rgba(255,255,255,0.48)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}>
            {group.label}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {group.replenishments.map(replenishment => (
              <div
                key={replenishment.id}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.1rem',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.035)',
                }}
              >
                <div style={operationInfoStyle}>
                  <OperationIcon type="replenishment" />
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {replenishment.accountName || `Счет ${String(replenishment.accountId).slice(-4)}`}
                  </span>
                </div>
                <strong style={{
                  color: replenishment.status === 'FAILED' ? '#f87171' : '#4ade80',
                  whiteSpace: 'nowrap',
                }}>
                  +{formatMoney(replenishment.amount)} {replenishment.currency || ''}
                </strong>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState({ children, color = 'rgba(255,255,255,0.5)' }) {
  return (
    <div style={{ padding: '2.5rem', textAlign: 'center', color }}>
      {children}
    </div>
  );
}

function OperationIcon({ type, recipient }) {
  if (type === 'transfer') {
    return (
      <span style={{ ...operationIconStyle, color: '#a5b4fc' }}>
        <svg viewBox="0 0 24 24" aria-hidden="true" style={operationSvgStyle}>
          <path d="M7 7h9.5l-2.2-2.2M17 17H7.5l2.2 2.2" />
          <path d="M17 7a7 7 0 0 1 1.5 8M7 17a7 7 0 0 1-1.5-8" />
        </svg>
      </span>
    );
  }

  if (type === 'replenishment') {
    return (
      <span style={{ ...operationIconStyle, color: '#4ade80' }}>
        <svg viewBox="0 0 24 24" aria-hidden="true" style={operationSvgStyle}>
          <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
        </svg>
      </span>
    );
  }

  return (
    <span style={{ ...operationIconStyle, color: '#fbbf24' }}>
      <svg viewBox="0 0 24 24" aria-hidden="true" style={operationSvgStyle}>
        {recipient === 'MOBILE_PHONE' ? (
          <>
            <rect x="7.5" y="3" width="9" height="18" rx="2" />
            <path d="M10.5 6h3M11 18h2" />
          </>
        ) : recipient === 'INTERNET' ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18" />
          </>
        ) : (
          <>
            <path d="M3 11l9-7 9 7M5 10v10h14V10M9 20v-6h6v6" />
          </>
        )}
      </svg>
    </span>
  );
}

function groupTransfersByDate(transfers) {
  const groups = new Map();

  transfers.forEach(transfer => {
    const date = new Date(transfer.timeOfTransfer);
    const key = getLocalDateKey(date);
    if (!groups.has(key)) {
      groups.set(key, { key, date, transfers: [] });
    }
    groups.get(key).transfers.push(transfer);
  });

  return Array.from(groups.values())
    .sort((left, right) => right.date - left.date)
    .map(group => ({
      ...group,
      label: formatGroupDate(group.date),
      transfers: group.transfers.sort(
        (left, right) => new Date(right.timeOfTransfer) - new Date(left.timeOfTransfer)
      ),
    }));
}

function groupReplenishmentsByDate(replenishments) {
  const groups = new Map();

  replenishments.forEach(replenishment => {
    const date = new Date(replenishment.timeOfReplenishment);
    const key = getLocalDateKey(date);
    if (!groups.has(key)) {
      groups.set(key, { key, date, replenishments: [] });
    }
    groups.get(key).replenishments.push(replenishment);
  });

  return Array.from(groups.values())
    .sort((left, right) => right.date - left.date)
    .map(group => ({
      ...group,
      label: formatGroupDate(group.date),
      replenishments: group.replenishments.sort(
        (left, right) =>
          new Date(right.timeOfReplenishment) - new Date(left.timeOfReplenishment)
      ),
    }));
}

function groupPaymentsByDate(payments) {
  const groups = new Map();

  payments.forEach(payment => {
    const date = new Date(payment.timeOfPay);
    const key = getLocalDateKey(date);
    if (!groups.has(key)) {
      groups.set(key, { key, date, payments: [] });
    }
    groups.get(key).payments.push(payment);
  });

  return Array.from(groups.values())
    .sort((left, right) => right.date - left.date)
    .map(group => ({
      ...group,
      label: formatGroupDate(group.date),
      payments: group.payments.sort(
        (left, right) => new Date(right.timeOfPay) - new Date(left.timeOfPay)
      ),
    }));
}

function buildAllOperations(transfers, payments, replenishments, cashbackByPaymentId) {
  const transferOperations = transfers.map(transfer => {
    const amount = getDisplayAmount(transfer);
    const isAccountTransfer = transfer.operationType === 'ACCOUNT';
    return {
      id: transfer.id,
      type: 'transfer',
      date: transfer.timeOfTransfer,
      title: isAccountTransfer
        ? 'Между своими счетами'
        : transfer.counterparty || 'Контрагент не указан',
      purpose: isAccountTransfer
        ? `${formatAccountName(transfer.accountFromName, transfer.accountFrom)} → ${formatAccountName(transfer.accountToName, transfer.accountTo)}`
        : transfer.message || (transfer.incoming ? 'Входящий перевод' : 'Перевод'),
      amount: amount.value,
      currency: amount.currency,
      sign: isAccountTransfer || !transfer.incoming ? '−' : '+',
      incoming: !isAccountTransfer && transfer.incoming,
      status: transfer.status,
      path: `/history/transfers/${transfer.id}`,
    };
  });

  const paymentOperations = payments.map(payment => {
    const cashback = cashbackByPaymentId.get(String(payment.id));
    return {
      id: payment.id,
      type: 'payment',
      date: payment.timeOfPay,
      title: getPaymentRecipientLabel(payment.recipient),
      purpose: getPaymentPurpose(payment),
      amount: payment.amount,
      currency: payment.currency,
      sign: '−',
      incoming: false,
      status: payment.status,
      recipient: payment.recipient,
      path: `/history/payments/${payment.id}`,
      cashbackAmount: cashback?.cashbackAmount,
    };
  });

  const replenishmentOperations = replenishments.map(replenishment => ({
    id: replenishment.id,
    type: 'replenishment',
    date: replenishment.timeOfReplenishment,
    title: 'Пополнение',
    purpose: replenishment.accountName
      || `Счет ${String(replenishment.accountId || '').slice(-4)}`,
    amount: replenishment.amount,
    currency: replenishment.currency,
    sign: '+',
    incoming: true,
    status: replenishment.status,
    path: null,
  }));

  return [...transferOperations, ...paymentOperations, ...replenishmentOperations];
}

function buildBalanceHistory(accounts, rates, transfers, payments, replenishments, period = 'day') {
  if (!rates || accounts.length === 0) return [];

  const periodConfig = period === 'week'
    ? { unit: 'day', points: 7 }
    : { unit: 'hour' };
  const getRubAmount = (amount, currency) => {
    const rate = currency === 'RUB' ? 1 : Number(rates[currency]);
    const numericAmount = Number(amount);
    return Number.isFinite(rate) && Number.isFinite(numericAmount)
      ? numericAmount * rate
      : null;
  };
  const currentBalance = accounts.reduce((total, account) => {
    const rubAmount = getRubAmount(account.balance || 0, account.currency);
    return rubAmount === null ? total : total + rubAmount;
  }, 0);

  if (!Number.isFinite(currentBalance)) return [];

  const currentPeriodStart = getPeriodStart(new Date(), periodConfig.unit);
  const periods = buildChartPeriods(currentPeriodStart, periodConfig);
  const periodChanges = new Map(periods.map(item => [item.key, 0]));

  const addChange = (dateValue, amount) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return;
    const periodStart = getPeriodStart(date, periodConfig.unit);
    const key = getPeriodKey(periodStart, periodConfig.unit);
    if (!periodChanges.has(key) || !Number.isFinite(amount)) return;
    periodChanges.set(key, periodChanges.get(key) + amount);
  };

  transfers.forEach(transfer => {
    if (transfer.status !== 'SUCCESS' || transfer.operationType === 'ACCOUNT') return;
    if (transfer.incoming) {
      const amount = getRubAmount(
        transfer.amountTo ?? transfer.amount,
        transfer.targetCurrency ?? transfer.currency
      );
      if (amount !== null) addChange(transfer.timeOfTransfer, amount);
    } else {
      const amount = getRubAmount(
        transfer.debitAmount ?? transfer.amount,
        transfer.currency
      );
      if (amount !== null) addChange(transfer.timeOfTransfer, -amount);
    }
  });

  payments.forEach(payment => {
    if (payment.status !== 'SUCCESS') return;
    const amount = getRubAmount(payment.amount, payment.currency);
    if (amount !== null) addChange(payment.timeOfPay, -amount);
  });

  replenishments.forEach(replenishment => {
    if (replenishment.status !== 'SUCCESS') return;
    const amount = getRubAmount(replenishment.amount, replenishment.currency);
    if (amount !== null) addChange(replenishment.timeOfReplenishment, amount);
  });

  const points = new Array(periods.length);
  let runningBalance = currentBalance;
  for (let index = periods.length - 1; index >= 0; index -= 1) {
    const periodItem = periods[index];
    points[index] = {
      key: periodItem.key,
      date: periodItem.start,
      balance: Math.max(runningBalance, 0),
    };
    runningBalance -= periodChanges.get(periodItem.key) || 0;
  }

  return points;
}

function groupOperationsByDate(operations) {
  const groups = new Map();

  operations.forEach(operation => {
    const date = new Date(operation.date);
    const key = getLocalDateKey(date);
    if (!groups.has(key)) {
      groups.set(key, { key, date, operations: [] });
    }
    groups.get(key).operations.push(operation);
  });

  return Array.from(groups.values())
    .sort((left, right) => right.date - left.date)
    .map(group => ({
      ...group,
      label: formatGroupDate(group.date),
      operations: group.operations.sort(
        (left, right) => new Date(right.date) - new Date(left.date)
      ),
    }));
}

function getPaymentRecipientLabel(recipient) {
  if (recipient === 'MOBILE_PHONE') return 'Мобильный телефон';
  if (recipient === 'INTERNET') return 'Интернет';
  if (recipient === 'UTILITIES') return 'ЖКХ';
  return 'Оплата услуги';
}

function getPaymentPurpose(payment) {
  const destination = String(payment.paymentDestination || '');
  if (payment.recipient === 'MOBILE_PHONE') {
    return `Телефон ${formatPhone(destination)}`;
  }
  return `Договор № ${destination}`;
}

function getDisplayAmount(transfer) {
  if (transfer.operationType === 'ACCOUNT') {
    return {
      value: transfer.amount,
      currency: transfer.currency,
    };
  }
  if (transfer.incoming) {
    return {
      value: transfer.amountTo ?? transfer.amount,
      currency: transfer.targetCurrency ?? transfer.currency,
    };
  }
  return {
    value: transfer.debitAmount ?? transfer.amount,
    currency: transfer.currency,
  };
}

function getAmountColor(transfer) {
  if (transfer.status === 'FAILED') return '#f87171';
  if (transfer.operationType === 'ACCOUNT') return '#fff';
  if (transfer.incoming) return '#4ade80';
  return '#fff';
}

function getOperationAmountColor(operation) {
  if (operation.status === 'FAILED') return '#f87171';
  if (operation.incoming) return '#4ade80';
  return '#fff';
}

function buildCashbackByPaymentId(accruals) {
  return accruals.reduce((map, accrual) => {
    if (accrual.paymentId) {
      map.set(String(accrual.paymentId), accrual);
    }
    return map;
  }, new Map());
}

function hasCashback(operation) {
  return operation.type === 'payment' && Number(operation.cashbackAmount || 0) > 0;
}

function formatCashbackBadge(amount) {
  return Math.round(Number(amount || 0)).toLocaleString('ru-RU', {
    maximumFractionDigits: 0,
  });
}

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getPeriodKey(date, unit) {
  const dayKey = getLocalDateKey(date);
  if (unit === 'hour') {
    return `${dayKey}-${date.getHours()}`;
  }
  return dayKey;
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfHour(value) {
  const date = new Date(value);
  date.setMinutes(0, 0, 0);
  return date;
}

function getPeriodStart(value, unit) {
  if (unit === 'hour') return startOfHour(value);

  const date = startOfDay(value);
  if (unit !== 'week') return date;

  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

function buildChartPeriods(currentPeriodStart, periodConfig) {
  if (periodConfig.unit === 'hour') {
    const today = startOfDay(currentPeriodStart);
    const currentHour = currentPeriodStart.getHours();
    return Array.from({ length: currentHour + 1 }, (_, index) => {
      const start = new Date(today);
      start.setHours(index, 0, 0, 0);
      return {
        key: getPeriodKey(start, periodConfig.unit),
        start,
      };
    });
  }

  return Array.from({ length: periodConfig.points }, (_, index) => {
    const start = addPeriods(currentPeriodStart, index - (periodConfig.points - 1), periodConfig.unit);
    return {
      key: getPeriodKey(start, periodConfig.unit),
      start,
    };
  });
}

function addPeriods(value, count, unit) {
  const date = new Date(value);
  if (unit === 'hour') {
    date.setHours(date.getHours() + count);
    return date;
  }
  date.setDate(date.getDate() + count * (unit === 'week' ? 7 : 1));
  return date;
}

function getChartLabelIndexes(length) {
  if (length === 24) {
    return [0, 3, 6, 9, 12, 15, 18, 21, 23];
  }
  if (length <= 8) {
    return Array.from({ length }, (_, index) => index);
  }

  return [0, Math.floor((length - 1) / 2), length - 1];
}

function formatGroupDate(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (getLocalDateKey(date) === getLocalDateKey(today)) return 'Сегодня';
  if (getLocalDateKey(date) === getLocalDateKey(yesterday)) return 'Вчера';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCompactMoney(value) {
  return new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatChartDate(value, period = 'day') {
  const date = new Date(value);
  if (period === 'day') {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
}

function formatAccountName(name, id) {
  return name || `Счет ${String(id || '').slice(-4)}`;
}

const groupTitleStyle = {
  marginBottom: '0.75rem',
  color: 'rgba(255,255,255,0.48)',
  fontSize: '0.85rem',
  fontWeight: 600,
};

const operationButtonStyle = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem 1.1rem',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.035)',
  color: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
};

const allOperationStyle = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem 1.1rem',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.035)',
  color: '#fff',
  textAlign: 'left',
};

const operationTitleStyle = {
  overflow: 'hidden',
  color: '#fff',
  fontWeight: 600,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const operationPurposeStyle = {
  marginTop: '0.3rem',
  overflow: 'hidden',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '0.8rem',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const operationInfoStyle = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
};

const operationAmountGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '0.65rem',
  minWidth: 0,
};

const cashbackChipStyle = {
  minWidth: '42px',
  height: '30px',
  padding: '0 0.65rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(251,191,36,0.42)',
  borderRadius: '999px',
  background: 'rgba(251,191,36,0.14)',
  color: '#facc15',
  fontSize: '0.78rem',
  fontWeight: 850,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

const operationIconStyle = {
  width: '38px',
  height: '38px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.045)',
};

const operationSvgStyle = {
  width: '21px',
  height: '21px',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const historyWarningStyle = {
  marginBottom: '1rem',
  padding: '0.8rem 1rem',
  border: '1px solid rgba(248,113,113,0.25)',
  borderRadius: '12px',
  background: 'rgba(248,113,113,0.08)',
  color: '#fda4af',
  fontSize: '0.85rem',
};

const chartCardStyle = {
  marginBottom: '1.5rem',
  padding: '1.5rem',
  borderRadius: '20px',
};

const chartHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1.5rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
};

const chartHeaderRightStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '1rem',
  marginLeft: 'auto',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const chartPeriodToggleStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.04)',
};

function getChartPeriodButtonStyle(active) {
  return {
    minWidth: '76px',
    padding: '0.45rem 0.7rem',
    border: 'none',
    borderRadius: '9px',
    background: active ? 'rgba(74,222,128,0.18)' : 'transparent',
    color: active ? '#bbf7d0' : 'rgba(255,255,255,0.58)',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.78rem',
    transition: 'background 0.2s ease, color 0.2s ease',
  };
}

const chartTitleStyle = {
  fontSize: '1.15rem',
  marginBottom: '0.35rem',
};

const chartSubtitleStyle = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: '0.82rem',
};

const chartNoteStyle = {
  marginTop: '0.5rem',
  color: 'rgba(255,255,255,0.35)',
  fontSize: '0.72rem',
};

const pageHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '2rem',
};

const reportButtonStyle = {
  padding: '0.75rem 1.1rem',
  border: '1px solid rgba(129,140,248,0.35)',
  borderRadius: '12px',
  background: 'rgba(99,102,241,0.14)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(8px)',
};

const modalStyle = {
  width: '100%',
  maxWidth: '480px',
  padding: '2rem',
  borderRadius: '20px',
  textAlign: 'center',
};

const modalButtonStyle = {
  marginTop: '1.5rem',
  padding: '0.75rem 1.5rem',
  border: '1px solid rgba(129,140,248,0.35)',
  borderRadius: '10px',
  background: 'rgba(99,102,241,0.18)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};
