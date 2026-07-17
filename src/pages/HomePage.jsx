import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCashbackAccruals,
  getCurrentCashbackCategories,
  getCurrencyRates,
  getMyAccounts,
  getPayments,
  getReplenishments,
  getTransferHistory,
} from '../api';
import './HomePage.css';

const currencies = ['RUB', 'USD', 'CNY'];

const currencyMeta = {
  RUB: { sign: '₽', color: '#8cf29b', name: 'Российский рубль' },
  USD: { sign: '$', color: '#6dd6ff', name: 'Доллар США' },
  CNY: { sign: '¥', color: '#8b7cff', name: 'Китайский юань' },
};

const cashbackCategoryMeta = {
  MOBILE_PHONE: { label: 'Мобильная связь', icon: 'phone' },
  INTERNET: { label: 'Интернет', icon: 'globe' },
  UTILITIES: { label: 'ЖКХ', icon: 'home' },
};

const quickActions = [
  {
    icon: 'phone',
    eyebrow: 'СБП',
    title: 'По телефону',
    description: 'Мгновенный перевод',
    path: '/transfers/phone',
  },
  {
    icon: 'send',
    eyebrow: 'CARD',
    title: 'На карту',
    description: 'По номеру карты',
    path: '/transfers/card',
  },
  {
    icon: 'plus',
    eyebrow: 'TOP UP',
    title: 'Пополнить',
    description: 'Внести средства',
    path: '/replenishment',
  },
  {
    icon: 'receipt',
    eyebrow: 'BILLS',
    title: 'Оплатить',
    description: 'Услуги и счета',
    path: '/payments',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [rates, setRates] = useState(null);
  const [cashbackAccruals, setCashbackAccruals] = useState([]);
  const [cashbackCategories, setCashbackCategories] = useState([]);
  const [recentOperations, setRecentOperations] = useState([]);
  const [balanceCurrency, setBalanceCurrency] = useState('RUB');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [cashbackLoading, setCashbackLoading] = useState(true);
  const [cashbackError, setCashbackError] = useState(false);
  const [cashbackCategoriesLoading, setCashbackCategoriesLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyAvailability, setHistoryAvailability] = useState('available');

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      const [
        accountsResult,
        ratesResult,
        cashbackResult,
        categoriesResult,
        transfersResult,
        paymentsResult,
        replenishmentsResult,
      ] = await Promise.allSettled([
        getMyAccounts(),
        getCurrencyRates(),
        getCashbackAccruals(),
        getCurrentCashbackCategories(),
        getTransferHistory(),
        getPayments(),
        getReplenishments(),
      ]);

      if (!mounted) return;

      if (accountsResult.status === 'fulfilled') {
        setAccounts(Array.isArray(accountsResult.value) ? accountsResult.value : []);
      } else {
        console.error('Ошибка загрузки счетов:', accountsResult.reason);
      }

      if (ratesResult.status === 'fulfilled') {
        setRates(ratesResult.value);
      } else {
        console.error('Ошибка загрузки курсов:', ratesResult.reason);
      }

      if (cashbackResult.status === 'fulfilled') {
        setCashbackAccruals(Array.isArray(cashbackResult.value) ? cashbackResult.value : []);
      } else {
        console.error('Ошибка загрузки кешбэка:', cashbackResult.reason);
        setCashbackError(true);
      }

      if (categoriesResult.status === 'fulfilled') {
        setCashbackCategories(
          Array.isArray(categoriesResult.value?.categories)
            ? categoriesResult.value.categories
            : []
        );
      } else {
        console.error('Ошибка загрузки категорий кешбэка:', categoriesResult.reason);
      }

      const transfers = transfersResult.status === 'fulfilled'
        && Array.isArray(transfersResult.value?.content)
        ? transfersResult.value.content
        : [];
      const payments = paymentsResult.status === 'fulfilled'
        && Array.isArray(paymentsResult.value?.content)
        ? paymentsResult.value.content
        : [];
      const replenishments = replenishmentsResult.status === 'fulfilled'
        && Array.isArray(replenishmentsResult.value)
        ? replenishmentsResult.value
        : [];
      const historyResults = [transfersResult, paymentsResult, replenishmentsResult];
      const failedHistoryRequests = historyResults.filter(result => result.status === 'rejected').length;

      setRecentOperations(buildRecentOperations(transfers, payments, replenishments).slice(0, 4));
      setHistoryAvailability(
        failedHistoryRequests === historyResults.length
          ? 'unavailable'
          : failedHistoryRequests > 0
            ? 'partial'
            : 'available'
      );

      setDashboardLoading(false);
      setCashbackLoading(false);
      setCashbackCategoriesLoading(false);
      setHistoryLoading(false);
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const accountOverview = useMemo(() => {
    if (!rates) return { accounts: [], totalRub: null };

    const preparedAccounts = accounts.map(account => {
      const balance = Number(account.balance || 0);
      const rate = getRate(account.currency, rates);
      const balanceRub = Number.isFinite(balance) && Number.isFinite(rate)
        ? balance * rate
        : 0;

      return { ...account, balanceRub };
    });

    const totalRub = preparedAccounts.reduce((total, account) => total + account.balanceRub, 0);
    return {
      accounts: preparedAccounts.sort((a, b) => b.balanceRub - a.balanceRub),
      totalRub,
    };
  }, [accounts, rates]);

  const totalBalance = useMemo(() => {
    const selectedRate = getRate(balanceCurrency, rates);
    if (!Number.isFinite(accountOverview.totalRub) || !Number.isFinite(selectedRate) || selectedRate === 0) {
      return null;
    }
    return accountOverview.totalRub / selectedRate;
  }, [accountOverview.totalRub, balanceCurrency, rates]);

  const currentMonthCashback = useMemo(
    () => calculateCurrentMonthCashback(cashbackAccruals, rates),
    [cashbackAccruals, rates]
  );

  const givenName = user?.firstName || user?.given_name;
  const familyName = user?.lastName || user?.family_name;
  const displayName = [givenName, familyName].filter(Boolean).join(' ')
    || user?.preferred_username
    || 'друг';
  const switchBalanceCurrency = () => {
    setBalanceCurrency(currentCurrency => {
      const currentIndex = currencies.indexOf(currentCurrency);
      return currencies[(currentIndex + 1) % currencies.length];
    });
  };

  return (
    <div className="home-terminal">
      <div className="home-terminal__grid" aria-hidden="true" />
      <div className="home-terminal__glow home-terminal__glow--mint" aria-hidden="true" />
      <div className="home-terminal__glow home-terminal__glow--violet" aria-hidden="true" />

      <section className="home-terminal__intro">
        <div>
          <h1><Link className="home-terminal__client-name" to="/profile">{displayName}</Link>, всё под контролем.</h1>
          <p>Счета, карты и денежные потоки — в одном финансовом пространстве.</p>
        </div>

        <div className="home-terminal__today">
          <span>Сегодня</span>
          <strong>{formatCurrentDate()}</strong>
        </div>
      </section>

      <section className="home-terminal__overview-grid">
        <article className="home-terminal__panel home-terminal__balance-panel">
          <div className="home-terminal__panel-noise" aria-hidden="true" />
          <header className="home-terminal__panel-header">
            <div>
              <span className="home-terminal__label">TOTAL PORTFOLIO</span>
              <h2>Общий баланс</h2>
            </div>
          </header>

          <div className="home-terminal__balance-panel-body">
            <div className="home-terminal__balance-block">
              <span className="home-terminal__balance-caption">Доступно на всех счетах</span>
              <button
                type="button"
                className={`home-terminal__balance ${dashboardLoading ? 'is-loading' : ''}`}
                onClick={switchBalanceCurrency}
                disabled={dashboardLoading || !Number.isFinite(totalBalance)}
                title="Нажмите, чтобы изменить валюту баланса"
                aria-label={`Общий баланс в ${balanceCurrency}. Нажмите, чтобы изменить валюту`}
              >
                {dashboardLoading
                  ? '— — —'
                  : Number.isFinite(totalBalance)
                    ? `${formatMoney(totalBalance)} ${getCurrencyMeta(balanceCurrency).sign}`
                    : 'Недоступно'}
              </button>
            </div>
            <span className="home-terminal__balance-hint">
              <span>{balanceCurrency}</span>
              Нажмите на сумму, чтобы сменить валюту
            </span>
          </div>
        </article>

        <button
          type="button"
          className="home-terminal__panel home-terminal__accounts-panel"
          onClick={() => navigate('/accounts')}
        >
              <span className="home-terminal__accounts-square-header">
                <span>
                  <small>ASSETS</small>
                  <strong>Мои счета</strong>
                </span>
                <span className="home-terminal__accounts-square-arrow"><Icon name="arrow-up" /></span>
              </span>

              <span className="home-terminal__accounts-square-list">
                {dashboardLoading ? (
                  <span className="home-terminal__accounts-square-loading">Загрузка...</span>
                ) : accountOverview.accounts.length > 0 ? (
                  accountOverview.accounts.slice(0, 4).map(account => {
                    const meta = getCurrencyMeta(account.currency);
                    return (
                      <span className="home-terminal__accounts-square-row" key={account.id}>
                        <i style={{ background: meta.color }} />
                        <span>{account.name || account.accountName || `${account.currency} счёт`}</span>
                        <strong>{formatCompactMoney(account.balance || 0)} {meta.sign}</strong>
                      </span>
                    );
                  })
                ) : (
                  <span className="home-terminal__accounts-square-empty">Счетов пока нет</span>
                )}
              </span>

              <span className="home-terminal__accounts-square-footer">
                {accounts.length} {pluralize(accounts.length, 'счёт', 'счёта', 'счетов')}
                <span>Открыть</span>
              </span>
        </button>

        <aside
          className="home-terminal__panel home-terminal__cashback-desk"
          role="link"
          tabIndex={0}
          onClick={() => navigate('/cashback')}
          onKeyDown={event => handlePanelKeyDown(event, () => navigate('/cashback'))}
        >
          <header className="home-terminal__panel-header">
            <div>
              <span className="home-terminal__label">CASHBACK</span>
              <h2>Кешбэк</h2>
            </div>
            <span className="home-terminal__cashback-desk-arrow"><Icon name="arrow-up" /></span>
          </header>

          <div className="home-terminal__cashback-total">
            <span className="home-terminal__cashback-period">
              Накоплено за <b>{formatCurrentMonth()}</b>
            </span>
            <strong className="home-terminal__cashback-amount">
              {cashbackLoading
                ? '— — —'
                : cashbackError || currentMonthCashback === null
                  ? 'Недоступно'
                  : <><span className="home-terminal__cashback-plus" aria-hidden="true">+</span>{formatWholeMoney(currentMonthCashback)}</>}
            </strong>
          </div>

          <div className="home-terminal__cashback-categories">
            <span className="home-terminal__cashback-categories-label">Выбранные категории</span>
            <div className="home-terminal__cashback-category-list">
              {cashbackCategoriesLoading ? (
                <span className="home-terminal__cashback-category-empty">Загрузка категорий...</span>
              ) : cashbackCategories.length > 0 ? (
                cashbackCategories.map(category => {
                  const categoryMeta = getCashbackCategoryMeta(category.recipient);
                  return (
                    <span className="home-terminal__cashback-category" key={category.recipient}>
                      <span className="home-terminal__cashback-category-icon">
                        <Icon name={categoryMeta.icon} />
                      </span>
                      <span>
                        <strong>{categoryMeta.label}</strong>
                        <small>{formatCategoryPercent(category.percent)} кешбэк</small>
                      </span>
                    </span>
                  );
                })
              ) : (
                <span className="home-terminal__cashback-category-empty">
                  Категории пока не выбраны
                </span>
              )}
            </div>
          </div>

          <footer className="home-terminal__cashback-footer">
            <span>Открыть программу кешбэка</span>
            <Icon name="arrow" />
          </footer>
        </aside>
      </section>

      <section className="home-terminal__lower-grid home-terminal__lower-grid--dashboard">
        <aside className="home-terminal__panel home-terminal__quick-rail">
          <header className="home-terminal__panel-header">
            <div>
              <span className="home-terminal__label">COMMANDS</span>
              <h2>Быстрые действия</h2>
            </div>
          </header>

          <div className="home-terminal__action-grid home-terminal__action-grid--rail">
            {quickActions.map((action, index) => (
              <button
                key={action.title}
                type="button"
                className="home-terminal__action"
                onClick={() => navigate(action.path)}
                style={{ '--action-index': index }}
              >
                <span className="home-terminal__action-icon"><Icon name={action.icon} /></span>
                <span className="home-terminal__action-copy">
                  <small>{action.eyebrow}</small>
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </span>
                <span className="home-terminal__action-arrow"><Icon name="arrow-up" /></span>
              </button>
            ))}
          </div>
        </aside>

        <article
          className="home-terminal__panel home-terminal__history-feed"
          role="link"
          tabIndex={0}
          onClick={() => navigate('/history')}
          onKeyDown={event => handlePanelKeyDown(event, () => navigate('/history'))}
        >
          <header className="home-terminal__panel-header">
            <div>
              <span className="home-terminal__label">ACTIVITY LOG</span>
              <h2>История операций</h2>
            </div>
            <span className="home-terminal__text-button">
              Все операции <Icon name="arrow" />
            </span>
          </header>

          <div className="home-terminal__history-feed-list">
            {historyLoading ? (
              <HistorySkeleton />
            ) : historyAvailability === 'unavailable' ? (
              <div className="home-terminal__history-feed-state">
                <Icon name="history" />
                <strong>История временно недоступна</strong>
                <span>Откройте раздел истории, чтобы повторить загрузку.</span>
              </div>
            ) : recentOperations.length > 0 ? (
              recentOperations.slice(0, 4).map(operation => (
                <div className="home-terminal__history-feed-row" key={operation.key}>
                  <span className={`home-terminal__history-feed-icon home-terminal__history-feed-icon--${operation.type}`}>
                    <Icon name={operation.icon} />
                  </span>
                  <span className="home-terminal__history-feed-copy">
                    <strong>{operation.title}</strong>
                    <small>{formatOperationDate(operation.date)} · {operation.purpose}</small>
                  </span>
                  <span className={`home-terminal__history-feed-amount ${operation.incoming ? 'is-positive' : ''} ${operation.status === 'FAILED' ? 'is-failed' : ''}`}>
                    <strong>
                      {operation.sign}{formatCompactMoney(operation.amount)} {getCurrencyMeta(operation.currency).sign}
                    </strong>
                    <small>{getOperationStatusLabel(operation.status)}</small>
                  </span>
                  <Icon name="arrow" />
                </div>
              ))
            ) : (
              <div className="home-terminal__history-feed-state">
                <Icon name="history" />
                <strong>Операций пока нет</strong>
                <span>Новые переводы, платежи и пополнения появятся здесь.</span>
              </div>
            )}
          </div>

          {historyAvailability === 'partial' && (
            <footer className="home-terminal__history-feed-notice">
              Часть операций временно недоступна
            </footer>
          )}
        </article>

      </section>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="home-terminal__history-skeleton" aria-label="Загрузка истории операций">
      {[0, 1, 2, 3].map(item => <span key={item} />)}
    </div>
  );
}

function Icon({ name }) {
  const paths = {
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.08 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    receipt: <><path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2Z" /><path d="M16 8h-6" /><path d="M16 12h-6" /></>,
    wallet: <><path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" /><path d="M16 14h.01" /></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 15h2" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    spark: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7Z" /><path d="m5 16-.8 2.2L2 19l2.2.8L5 22l.8-2.2L8 19l-2.2-.8Z" /><path d="m19 15-.7 1.3L17 17l1.3.7L19 19l.7-1.3L21 17l-1.3-.7Z" /></>,
    arrow: <><path d="m9 18 6-6-6-6" /></>,
    'arrow-up': <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.wallet}
    </svg>
  );
}

function getRate(currency, rates) {
  if (!rates) return Number.NaN;
  if (currency === 'RUB') return Number(rates.RUB ?? 1);
  return Number(rates[currency]);
}

function getCurrencyMeta(currency) {
  return currencyMeta[currency] || {
    sign: currency || '¤',
    color: '#f5c76b',
    name: currency || 'Валюта',
  };
}

function getCashbackCategoryMeta(recipient) {
  return cashbackCategoryMeta[recipient] || {
    label: recipient || 'Другая категория',
    icon: 'spark',
  };
}

function buildRecentOperations(transfers, payments, replenishments) {
  const transferOperations = transfers.map(transfer => {
    const isAccountTransfer = transfer.operationType === 'ACCOUNT';
    const amount = getTransferDisplayAmount(transfer);
    const incoming = !isAccountTransfer && Boolean(transfer.incoming);

    return {
      key: `transfer-${transfer.id}`,
      type: 'transfer',
      icon: 'send',
      date: transfer.timeOfTransfer,
      title: isAccountTransfer
        ? 'Между своими счетами'
        : transfer.counterparty || 'Перевод',
      purpose: isAccountTransfer
        ? `${formatAccountName(transfer.accountFromName, transfer.accountFrom)} → ${formatAccountName(transfer.accountToName, transfer.accountTo)}`
        : transfer.message || (incoming ? 'Входящий перевод' : 'Исходящий перевод'),
      amount: amount.value,
      currency: amount.currency,
      sign: incoming ? '+' : '−',
      incoming,
      status: transfer.status,
    };
  });

  const paymentOperations = payments.map(payment => {
    const category = getCashbackCategoryMeta(payment.recipient);
    const destination = String(payment.paymentDestination || '').trim();
    return {
      key: `payment-${payment.id}`,
      type: 'payment',
      icon: 'receipt',
      date: payment.timeOfPay,
      title: category.label || 'Оплата услуги',
      purpose: destination
        ? payment.recipient === 'MOBILE_PHONE'
          ? `Телефон ${destination}`
          : `Договор № ${destination}`
        : 'Оплата услуги',
      amount: Number(payment.amount || 0),
      currency: payment.currency || 'RUB',
      sign: '−',
      incoming: false,
      status: payment.status,
    };
  });

  const replenishmentOperations = replenishments.map(replenishment => ({
    key: `replenishment-${replenishment.id}`,
    type: 'replenishment',
    icon: 'plus',
    date: replenishment.timeOfReplenishment,
    title: 'Пополнение',
    purpose: replenishment.accountName
      || `Счёт •• ${String(replenishment.accountId || '').slice(-4)}`,
    amount: Number(replenishment.amount || 0),
    currency: replenishment.currency || 'RUB',
    sign: '+',
    incoming: true,
    status: replenishment.status,
  }));

  return [...transferOperations, ...paymentOperations, ...replenishmentOperations]
    .filter(operation => !Number.isNaN(new Date(operation.date).getTime()))
    .sort((left, right) => new Date(right.date) - new Date(left.date));
}

function getTransferDisplayAmount(transfer) {
  if (transfer.operationType === 'ACCOUNT') {
    return {
      value: Number(transfer.amount || 0),
      currency: transfer.currency || 'RUB',
    };
  }

  if (transfer.incoming) {
    return {
      value: Number(transfer.amountTo ?? transfer.amount ?? 0),
      currency: transfer.targetCurrency || transfer.currency || 'RUB',
    };
  }

  return {
    value: Number(transfer.debitAmount ?? transfer.amount ?? 0),
    currency: transfer.currency || 'RUB',
  };
}

function formatAccountName(name, id) {
  return name || `Счёт •• ${String(id || '').slice(-4)}`;
}

function calculateCurrentMonthCashback(accruals, rates) {
  if (!rates) return null;

  const now = new Date();
  return accruals.reduce((total, accrual) => {
    const paymentDate = new Date(accrual.paymentTime);
    if (
      Number.isNaN(paymentDate.getTime())
      || paymentDate.getFullYear() !== now.getFullYear()
      || paymentDate.getMonth() !== now.getMonth()
    ) {
      return total;
    }

    const amount = Number(accrual.cashbackAmount || 0);
    const rate = getRate(accrual.currency || 'RUB', rates);
    if (!Number.isFinite(amount) || !Number.isFinite(rate)) return total;
    return total + amount * rate;
  }, 0);
}

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCompactMoney(value) {
  return Number(value || 0).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatWholeMoney(value) {
  return Math.round(Number(value || 0)).toLocaleString('ru-RU');
}

function formatCategoryPercent(value) {
  const percent = Number(value || 0);
  return `${Number.isFinite(percent) ? percent.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) : 0}%`;
}

function formatCurrentMonth() {
  const value = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatOperationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Дата неизвестна';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (date.toDateString() === now.toDateString()) return `Сегодня, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Вчера, ${time}`;

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getOperationStatusLabel(status) {
  const labels = {
    SUCCESS: 'Выполнено',
    FAILED: 'Ошибка',
    PENDING: 'В обработке',
    PROCESSING: 'В обработке',
  };
  return labels[status] || status || 'В обработке';
}

function handlePanelKeyDown(event, action) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

function formatCurrentDate() {
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function pluralize(value, one, few, many) {
  const absolute = Math.abs(Number(value)) % 100;
  const last = absolute % 10;
  if (absolute > 10 && absolute < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}
