import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrencyRates, getMyAccounts } from '../api';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Layout.css';

const currencies = ['RUB', 'USD', 'CNY'];
const currencySigns = {
  RUB: '₽',
  USD: '$',
  CNY: '¥',
};

const navItems = [
  { to: '/home', icon: 'home', code: 'HM', label: 'Главная' },
  { to: '/cards', icon: 'cards', code: 'CD', label: 'Карты' },
  { to: '/accounts', icon: 'accounts', code: 'AC', label: 'Мои счета' },
  { to: '/transfers', icon: 'transfers', code: 'TR', label: 'Переводы' },
  { to: '/replenishment', icon: 'replenishment', code: 'UP', label: 'Пополнения' },
  { to: '/payments', icon: 'payments', code: 'PY', label: 'Платежи' },
  { to: '/cashback', icon: 'cashback', code: 'CB', label: 'Кешбэк' },
  { to: '/history', icon: 'history', code: 'HS', label: 'История' },
  { to: '/admin', icon: 'admin', code: 'AD', label: 'Админ' },
  { icon: 'about', code: 'AB', label: 'О проекте', placeholder: true },
];

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/home';
  const [accounts, setAccounts] = useState([]);
  const [rates, setRates] = useState(null);
  const [balanceCurrency, setBalanceCurrency] = useState('RUB');
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!user) return undefined;

    const fetchNavbarData = async () => {
      setBalanceLoading(true);
      try {
        const [accountsData, ratesData] = await Promise.all([
          getMyAccounts(),
          getCurrencyRates(),
        ]);
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
        setRates(ratesData);
      } catch (error) {
        console.error('Ошибка загрузки данных navbar:', error);
        setRates(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchNavbarData();
    return undefined;
  }, [location.pathname, user]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const selectedRate = getRate(balanceCurrency, rates);
  const totalRub = rates
    ? accounts.reduce((total, account) => {
        const rate = getRate(account.currency, rates);
        return Number.isFinite(rate)
          ? total + Number(account.balance || 0) * rate
          : total;
      }, 0)
    : null;
  const totalBalance = Number.isFinite(totalRub) && Number.isFinite(selectedRate) && selectedRate !== 0
    ? totalRub / selectedRate
    : null;

  const switchBalanceCurrency = () => {
    setBalanceCurrency(currentCurrency => {
      const currentIndex = currencies.indexOf(currentCurrency);
      return currencies[(currentIndex + 1) % currencies.length];
    });
  };

  const handleLogout = event => {
    event.preventDefault();
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    form.style.display = 'none';
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className={`app-shell ${isHomePage ? 'app-shell--home' : ''}`}>
      <aside
        id="primary-navigation"
        className={`app-sidebar ${mobileNavOpen ? 'is-open' : ''}`}
        aria-label="Основная навигация"
      >
        <Link className="app-brand" to="/home">
          <span className="app-brand__mark">PF</span>
          <span className="app-brand__copy">
            <strong>Pay<span>Flow</span></strong>
            <small>FINANCE OS</small>
          </span>
        </Link>

        <span className="app-sidebar__label">НАВИГАЦИЯ</span>
        <nav className="app-nav">
          {navItems.map(item => {
            const content = (
              <>
                <span className="app-nav__icon"><LayoutIcon name={item.icon} /></span>
                <span className="app-nav__label">{item.label}</span>
                <span className="app-nav__code">{item.code}</span>
              </>
            );

            if (item.placeholder) {
              return (
                <span
                  key={item.label}
                  className="app-nav__item app-nav__item--placeholder"
                  title="Раздел появится позже"
                  aria-disabled="true"
                >
                  {content}
                </span>
              );
            }

            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={`app-nav__item ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar__status">
          <i aria-hidden="true" />
          SECURE SESSION
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      {user && (
        <header className="app-header">
          <div className="app-header__left">
            <button
              type="button"
              className="app-header__menu"
              onClick={() => setMobileNavOpen(current => !current)}
              aria-label="Открыть меню"
              aria-expanded={mobileNavOpen}
              aria-controls="primary-navigation"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <button
              type="button"
              className="app-header__balance"
              onClick={switchBalanceCurrency}
              title="Нажмите, чтобы изменить валюту баланса"
              aria-label={`Общий баланс в ${balanceCurrency}. Нажмите, чтобы изменить валюту`}
              disabled={balanceLoading || !Number.isFinite(totalBalance)}
            >
              <span className="app-header__balance-label">ОБЩИЙ БАЛАНС · {balanceCurrency}</span>
              <strong className="app-header__balance-value">
                {balanceLoading
                  ? 'Загрузка...'
                  : Number.isFinite(totalBalance)
                    ? `${formatMoney(totalBalance)} ${currencySigns[balanceCurrency]}`
                    : 'Недоступен'}
              </strong>
            </button>

            <div className="app-header__rates" aria-label="Курсы валют">
              <div className="app-header__rate">
                <CurrencyFlag currency="USD" />
                <span>USD / RUB</span>
                <strong>{rates?.USD ? formatMoney(rates.USD) : '—'}</strong>
              </div>
              <div className="app-header__rate">
                <CurrencyFlag currency="CNY" />
                <span>CNY / RUB</span>
                <strong>{rates?.CNY ? formatMoney(rates.CNY) : '—'}</strong>
              </div>
            </div>
          </div>

          <div className="app-header__actions">
            <NotificationBell />
            <Link className="app-header__profile" to="/profile" title="Профиль">
              {(user.firstName || user.preferred_username || 'U')[0].toUpperCase()}
            </Link>
            <button
              type="button"
              className="app-header__logout"
              onClick={handleLogout}
              aria-label="Выйти"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
              </svg>
              <span>Выйти</span>
            </button>
          </div>
        </header>
      )}

      <main className={`app-main ${isHomePage ? 'app-main--home' : 'app-main--default'}`}>
        <div className="app-main__content">{children}</div>
      </main>
    </div>
  );
}

function getRate(currency, rates) {
  if (!rates) return Number.NaN;
  if (currency === 'RUB') return Number(rates.RUB ?? 1);
  return Number(rates[currency]);
}

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CurrencyFlag({ currency }) {
  if (currency === 'USD') {
    return (
      <svg viewBox="0 0 24 16" aria-label="Флаг США" className="app-header__flag">
        <rect width="24" height="16" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12, 14].map(y => (
          <rect key={y} y={y} width="24" height="1" fill="#dc2626" />
        ))}
        <rect width="10" height="8" fill="#1d4ed8" />
        <g fill="#fff">
          <circle cx="2" cy="2" r="0.6" />
          <circle cx="5" cy="2" r="0.6" />
          <circle cx="8" cy="2" r="0.6" />
          <circle cx="3.5" cy="4" r="0.6" />
          <circle cx="6.5" cy="4" r="0.6" />
          <circle cx="2" cy="6" r="0.6" />
          <circle cx="5" cy="6" r="0.6" />
          <circle cx="8" cy="6" r="0.6" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 16" aria-label="Флаг Китая" className="app-header__flag">
      <rect width="24" height="16" fill="#dc2626" />
      <polygon points="5,2 5.7,4 7.8,4 6.1,5.2 6.8,7.2 5,6 3.2,7.2 3.9,5.2 2.2,4 4.3,4" fill="#facc15" />
    </svg>
  );
}

function LayoutIcon({ name }) {
  const paths = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    cards: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 15h3" /></>,
    accounts: <><path d="m3 9 9-5 9 5" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8" /><path d="M3 20h18" /></>,
    transfers: <><path d="M4 7h14l-3-3M20 17H6l3 3" /><path d="m18 4 3 3-3 3M6 14l-3 3 3 3" /></>,
    replenishment: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    payments: <><path d="M5 3v18l2-2 2 2 3-2 3 2 2-2 2 2V3l-2 2-2-2-3 2-3-2-2 2Z" /><path d="M9 10h6M9 14h6" /></>,
    cashback: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7Z" /><path d="m5 16-.8 2.2L2 19l2.2.8L5 22l.8-2.2L8 19l-2.2-.8Z" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    admin: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="18" r="2" /></>,
    about: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] || paths.home}
    </svg>
  );
}
