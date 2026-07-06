import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCashbackAccruals,
  getAvailableCashbackCategories,
  getCurrentCashbackCategories,
  selectCashbackCategories,
} from '../api';

const recipientLabels = {
  MOBILE_PHONE: 'Мобильный телефон',
  INTERNET: 'Интернет',
  UTILITIES: 'ЖКХ',
};

const statusLabels = {
  PENDING: 'Ожидает выплаты',
  PAID: 'Выплачен',
};

const recipientMetadata = {
  MOBILE_PHONE: {
    icon: '📱',
    title: 'Мобильная связь',
    description: 'Платежи за телефон',
  },
  INTERNET: {
    icon: '🌐',
    title: 'Интернет',
    description: 'Домашний интернет и связь',
  },
  UTILITIES: {
    icon: '🏠',
    title: 'ЖКХ',
    description: 'Коммунальные платежи',
  },
};

export default function CashbackPage() {
  const [accruals, setAccruals] = useState([]);
  const [categorySelection, setCategorySelection] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [maxSelectedCategories, setMaxSelectedCategories] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [availableLoading, setAvailableLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');
  const [availableError, setAvailableError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getMonthValue(new Date()));
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectionSaving, setSelectionSaving] = useState(false);
  const [selectionError, setSelectionError] = useState('');

  useEffect(() => {
    const loadCashback = async () => {
      try {
        const result = await getCashbackAccruals();
        setAccruals(Array.isArray(result) ? result : []);
        setError('');
      } catch (requestError) {
        setError(requestError.message || 'Не удалось загрузить начисления кешбэка');
      } finally {
        setLoading(false);
      }
    };

    loadCashback();
    window.addEventListener('focus', loadCashback);
    return () => {
      window.removeEventListener('focus', loadCashback);
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCurrentCashbackCategories();
        setCategorySelection(result);
        if (Number.isFinite(Number(result?.maxSelectedCategories))) {
          setMaxSelectedCategories(Number(result.maxSelectedCategories));
        }
      } catch (requestError) {
        console.error('Ошибка загрузки выбранных категорий кешбэка:', requestError);
        setCategoriesError(requestError.message || 'Не удалось загрузить категории кешбэка');
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadAvailableCategories = async () => {
      try {
        const result = await getAvailableCashbackCategories();
        const categories = Array.isArray(result?.categories) ? result.categories : [];
        const limit = Number(result?.maxSelectedCategories || 1);
        setAvailableCategories(categories);
        setMaxSelectedCategories(Number.isFinite(limit) ? Math.max(limit, 1) : 1);
      } catch (requestError) {
        console.error('Ошибка загрузки доступных категорий кешбэка:', requestError);
        setAvailableError(requestError.message || 'Не удалось загрузить доступные категории');
      } finally {
        setAvailableLoading(false);
      }
    };

    loadAvailableCategories();
  }, []);

  const selectedCategories = Array.isArray(categorySelection?.categories)
    ? categorySelection.categories
    : [];
  const hasSelectedCategories = selectedCategories.length > 0;
  const categoryOptions = useMemo(
    () => availableCategories.map(category => ({
      ...category,
      ...(recipientMetadata[category.recipient] || {
        icon: '✨',
        title: recipientLabels[category.recipient] || category.recipient,
        description: 'Повышенный кешбэк',
      }),
    })),
    [availableCategories]
  );
  const availableCategoriesUnavailable = !availableLoading
    && (Boolean(availableError) || categoryOptions.length === 0);
  const cashbackServiceUnavailable = (
    (!categoriesLoading && Boolean(categoriesError))
    || (!hasSelectedCategories && availableCategoriesUnavailable)
  );
  const canSelectCategory = !cashbackServiceUnavailable
    && !availableLoading
    && !hasSelectedCategories
    && categoryOptions.length > 0;

  const monthAccruals = useMemo(
    () => accruals.filter(accrual => getMonthValue(accrual.paymentTime) === selectedMonth),
    [accruals, selectedMonth]
  );
  const groupedAccruals = useMemo(() => groupAccrualsByDate(monthAccruals), [monthAccruals]);
  const monthTotal = useMemo(
    () => monthAccruals.reduce((total, accrual) => total + Number(accrual.cashbackAmount || 0), 0),
    [monthAccruals]
  );

  const handleSaveCategory = async () => {
    setSelectionSaving(true);
    setSelectionError('');
    try {
      const result = await selectCashbackCategories(selectedRecipients);
      setCategorySelection(result);
      setCategoryModalOpen(false);
    } catch (requestError) {
      setSelectionError(requestError.message || 'Не удалось сохранить категорию');
    } finally {
      setSelectionSaving(false);
    }
  };

  const toggleRecipient = (recipient) => {
    setSelectedRecipients(current => {
      if (current.includes(recipient)) {
        return current.filter(item => item !== recipient);
      }
      if (current.length >= maxSelectedCategories) {
        return current;
      }
      return [...current, recipient];
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Кешбэк
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            Начисления по выполненным платежам
          </p>
        </div>

        <label style={monthPickerStyle}>
          <span style={monthPickerLabelStyle}>Месяц</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={event => setSelectedMonth(event.target.value)}
            style={monthInputStyle}
          />
        </label>
      </div>

      <div className="glass" style={categoryCardStyle}>
        <div>
          <span style={summaryLabelStyle}>Повышенная категория текущего месяца</span>
          {categoriesLoading ? (
            <strong style={categoryTitleStyle}>Загрузка...</strong>
          ) : cashbackServiceUnavailable ? (
            <strong style={{ ...categoryTitleStyle, color: '#fda4af' }}>
              Сервис кешбека на данный момент недоступен
            </strong>
          ) : hasSelectedCategories ? (
            <div style={selectedCategoryListStyle}>
              {selectedCategories.map(category => (
                <div key={category.recipient} style={selectedCategoryChipStyle}>
                  <span>{getRecipientIcon(category.recipient)}</span>
                  <strong>{recipientLabels[category.recipient] || category.recipient}</strong>
                  <span style={{ color: '#99f6e4' }}>{formatPercent(category.percent)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <strong style={categoryTitleStyle}>Категория еще не выбрана</strong>
              <p style={categoryDescriptionStyle}>
                {canSelectCategory
                  ? `Выберите до ${maxSelectedCategories} категорий платежей. После сохранения изменить выбор в текущем месяце нельзя.`
                  : availableLoading
                    ? 'Загружаем доступные категории.'
                    : 'Сервис кешбека на данный момент недоступен'}
              </p>
            </>
          )}
        </div>

        {!categoriesLoading && !categoriesError && !hasSelectedCategories && canSelectCategory && (
          <button
            type="button"
            onClick={() => {
              setSelectedRecipients([]);
              setSelectionError('');
              setCategoryModalOpen(true);
            }}
            style={selectCategoryButtonStyle}
          >
            Выбрать категорию
          </button>
        )}
      </div>

      <div style={summaryGridStyle}>
        <div className="glass" style={summaryCardStyle}>
          <span style={summaryLabelStyle}>Начислено за месяц</span>
          <strong style={summaryValueStyle}>{formatCashbackMoney(monthTotal)} ₽</strong>
        </div>
        <div className="glass" style={summaryCardStyle}>
          <span style={summaryLabelStyle}>Платежей с кешбэком</span>
          <strong style={summaryValueStyle}>{monthAccruals.length}</strong>
        </div>
      </div>

      <div className="glass" style={listCardStyle}>
        {loading ? (
          <EmptyState>Загрузка начислений...</EmptyState>
        ) : error ? (
          <EmptyState color="#fda4af">{error}</EmptyState>
        ) : monthAccruals.length === 0 ? (
          <EmptyState>За выбранный месяц кешбэк не начислялся</EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {groupedAccruals.map(group => (
              <section key={group.key}>
                <h2 style={groupTitleStyle}>{group.label}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {group.accruals.map(accrual => (
                    <Link
                      key={accrual.id}
                      to={`/history/payments/${accrual.paymentId}`}
                      style={accrualRowStyle}
                    >
                      <div style={paymentInfoStyle}>
                        <span style={cashbackIconStyle}>
                          <svg viewBox="0 0 24 24" aria-hidden="true" style={cashbackSvgStyle}>
                            <path d="M12 3l2.4 5.1 5.6.7-4.1 3.9 1 5.5L12 15.5 7.1 18.2l1-5.5L4 8.8l5.6-.7L12 3z" />
                          </svg>
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={paymentTitleStyle}>
                            {recipientLabels[accrual.recipient] || 'Платеж'}
                          </div>
                          <div style={paymentMetaStyle}>
                            Платеж на {formatMoney(accrual.paymentAmount)} {accrual.currency || ''}
                            {' · '}
                            {formatTime(accrual.paymentTime)}
                            {' · '}
                            {statusLabels[accrual.status] || accrual.status}
                          </div>
                        </div>
                      </div>

                      <div style={cashbackAmountStyle}>
                        +{formatCashbackMoney(accrual.cashbackAmount)} {getCurrencySign(accrual.currency)}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {categoryModalOpen && (
        <div
          role="presentation"
          onClick={() => setCategoryModalOpen(false)}
          style={modalOverlayStyle}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cashback-category-title"
            onClick={event => event.stopPropagation()}
            className="glass"
            style={modalStyle}
          >
            <h2 id="cashback-category-title" style={{ marginBottom: '0.5rem' }}>
              Выберите категорию
            </h2>
            <p style={modalDescriptionStyle}>
              В текущем месяце можно выбрать до {maxSelectedCategories} категорий. После сохранения выбор фиксируется.
            </p>

            <div style={selectionCounterStyle}>
              Выбрано {selectedRecipients.length} из {maxSelectedCategories}
            </div>

            <div style={categoryOptionListStyle}>
              {categoryOptions.map(option => {
                const active = selectedRecipients.includes(option.recipient);
                const disabled = !active && selectedRecipients.length >= maxSelectedCategories;
                return (
                  <button
                    key={option.recipient}
                    type="button"
                    onClick={() => toggleRecipient(option.recipient)}
                    disabled={disabled}
                    style={{
                      ...categoryOptionStyle,
                      opacity: disabled ? 0.52 : 1,
                      border: active
                        ? '1px solid rgba(45,212,191,0.62)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: active
                        ? 'rgba(20,184,166,0.14)'
                        : 'rgba(255,255,255,0.035)',
                    }}
                  >
                    <span style={categoryOptionIconStyle}>{option.icon}</span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={categoryOptionTitleStyle}>{option.title}</strong>
                      <span style={categoryOptionDescriptionStyle}>{option.description}</span>
                    </span>
                    <span style={categoryPercentStyle}>{formatPercent(option.percent)}%</span>
                  </button>
                );
              })}
            </div>

            {selectionError && (
              <div style={selectionErrorStyle}>{selectionError}</div>
            )}

            <div style={modalActionsStyle}>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                style={secondaryButtonStyle}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveCategory}
                disabled={selectionSaving || selectedRecipients.length === 0}
                style={primaryButtonStyle}
              >
                {selectionSaving ? 'Сохраняем...' : 'Сохранить выбор'}
              </button>
            </div>
          </div>
        </div>
      )}
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

function groupAccrualsByDate(accruals) {
  const groups = new Map();

  accruals.forEach(accrual => {
    const date = new Date(accrual.paymentTime);
    const key = getLocalDateKey(date);
    if (!groups.has(key)) {
      groups.set(key, { key, date, accruals: [] });
    }
    groups.get(key).accruals.push(accrual);
  });

  return Array.from(groups.values())
    .sort((left, right) => right.date - left.date)
    .map(group => ({
      ...group,
      label: formatGroupDate(group.date),
      accruals: group.accruals.sort(
        (left, right) => new Date(right.paymentTime) - new Date(left.paymentTime)
      ),
    }));
}

function getMonthValue(value) {
  const date = value ? new Date(value) : new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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

function formatTime(value) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCashbackMoney(value) {
  return Math.round(Number(value || 0)).toLocaleString('ru-RU', {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  return Number(value || 0).toLocaleString('ru-RU', {
    maximumFractionDigits: 2,
  });
}

function getCurrencySign(currency) {
  if (currency === 'RUB') return '₽';
  if (currency === 'USD') return '$';
  if (currency === 'CNY') return '¥';
  return currency || '';
}

function getRecipientIcon(recipient) {
  return recipientMetadata[recipient]?.icon || '✨';
}

const pageHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const monthPickerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.65rem 0.8rem',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.04)',
};

const monthPickerLabelStyle = {
  color: 'rgba(255,255,255,0.48)',
  fontSize: '0.82rem',
};

const monthInputStyle = {
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: '#fff',
  fontWeight: 700,
};

const categoryCardStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '1rem',
  alignItems: 'center',
  padding: '1.25rem',
  borderRadius: '18px',
  border: '1px solid rgba(45,212,191,0.18)',
  background: 'linear-gradient(135deg, rgba(20,184,166,0.11), rgba(99,102,241,0.08))',
  marginBottom: '1.5rem',
};

const categoryTitleStyle = {
  display: 'block',
  marginTop: '0.45rem',
  color: '#fff',
  fontSize: '1.1rem',
};

const categoryDescriptionStyle = {
  marginTop: '0.45rem',
  color: 'rgba(255,255,255,0.46)',
  fontSize: '0.85rem',
};

const selectedCategoryListStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.65rem',
  marginTop: '0.75rem',
};

const selectedCategoryChipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.65rem 0.85rem',
  border: '1px solid rgba(45,212,191,0.24)',
  borderRadius: '12px',
  background: 'rgba(20,184,166,0.1)',
  color: '#fff',
};

const selectCategoryButtonStyle = {
  padding: '0.8rem 1.1rem',
  border: '1px solid rgba(45,212,191,0.34)',
  borderRadius: '12px',
  background: 'rgba(20,184,166,0.14)',
  color: '#ccfbf1',
  cursor: 'pointer',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const summaryCardStyle = {
  padding: '1.25rem',
  borderRadius: '18px',
  border: '1px solid rgba(45,212,191,0.16)',
  background: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(99,102,241,0.08))',
};

const summaryLabelStyle = {
  display: 'block',
  marginBottom: '0.55rem',
  color: 'rgba(255,255,255,0.48)',
  fontSize: '0.82rem',
};

const summaryValueStyle = {
  color: '#99f6e4',
  fontSize: '1.55rem',
};

const listCardStyle = {
  padding: '1.5rem',
  borderRadius: '20px',
};

const groupTitleStyle = {
  marginBottom: '0.75rem',
  color: 'rgba(255,255,255,0.48)',
  fontSize: '0.85rem',
  fontWeight: 600,
};

const accrualRowStyle = {
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
  textDecoration: 'none',
};

const paymentInfoStyle = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
};

const cashbackIconStyle = {
  width: '38px',
  height: '38px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(45,212,191,0.18)',
  borderRadius: '12px',
  background: 'rgba(20,184,166,0.08)',
  color: '#5eead4',
};

const cashbackSvgStyle = {
  width: '20px',
  height: '20px',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const paymentTitleStyle = {
  overflow: 'hidden',
  color: '#fff',
  fontWeight: 700,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const paymentMetaStyle = {
  marginTop: '0.3rem',
  overflow: 'hidden',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '0.8rem',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const cashbackAmountStyle = {
  color: '#5eead4',
  fontSize: '1rem',
  fontWeight: 800,
  whiteSpace: 'nowrap',
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
  maxWidth: '560px',
  padding: '1.6rem',
  borderRadius: '20px',
};

const modalDescriptionStyle = {
  marginBottom: '1.2rem',
  color: 'rgba(255,255,255,0.55)',
  fontSize: '0.9rem',
};

const selectionCounterStyle = {
  marginBottom: '0.9rem',
  padding: '0.55rem 0.75rem',
  border: '1px solid rgba(45,212,191,0.18)',
  borderRadius: '10px',
  background: 'rgba(20,184,166,0.08)',
  color: '#99f6e4',
  fontSize: '0.82rem',
  fontWeight: 700,
};

const categoryOptionListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.65rem',
};

const categoryOptionStyle = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '42px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '0.85rem',
  padding: '0.9rem',
  borderRadius: '14px',
  color: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
};

const categoryOptionIconStyle = {
  width: '42px',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.06)',
  fontSize: '1.25rem',
};

const categoryOptionTitleStyle = {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const categoryOptionDescriptionStyle = {
  display: 'block',
  marginTop: '0.25rem',
  overflow: 'hidden',
  color: 'rgba(255,255,255,0.45)',
  fontSize: '0.78rem',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const categoryPercentStyle = {
  color: '#99f6e4',
  fontWeight: 800,
  whiteSpace: 'nowrap',
};

const selectionErrorStyle = {
  marginTop: '1rem',
  padding: '0.75rem 0.9rem',
  border: '1px solid rgba(248,113,113,0.25)',
  borderRadius: '12px',
  background: 'rgba(248,113,113,0.08)',
  color: '#fda4af',
  fontSize: '0.85rem',
};

const modalActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1.2rem',
};

const secondaryButtonStyle = {
  padding: '0.75rem 1rem',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

const primaryButtonStyle = {
  padding: '0.75rem 1rem',
  border: '1px solid rgba(45,212,191,0.34)',
  borderRadius: '10px',
  background: 'rgba(20,184,166,0.16)',
  color: '#ccfbf1',
  cursor: 'pointer',
  fontWeight: 700,
};
