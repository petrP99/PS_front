export const cardCurrencyStyles = {
  RUB: {
    background: 'linear-gradient(135deg, rgba(37,99,235,0.28), rgba(99,102,241,0.16))',
    border: '1px solid rgba(96,165,250,0.38)',
    boxShadow: '0 14px 35px rgba(37,99,235,0.12)',
    accent: '#93c5fd',
  },
  USD: {
    background: 'linear-gradient(135deg, rgba(5,150,105,0.28), rgba(16,185,129,0.14))',
    border: '1px solid rgba(52,211,153,0.38)',
    boxShadow: '0 14px 35px rgba(5,150,105,0.12)',
    accent: '#6ee7b7',
  },
  CNY: {
    background: 'linear-gradient(135deg, rgba(220,38,38,0.3), rgba(234,179,8,0.14))',
    border: '1px solid rgba(251,191,36,0.4)',
    boxShadow: '0 14px 35px rgba(220,38,38,0.12)',
    accent: '#fcd34d',
  },
};

export const getCardCurrencyStyle = (currency) =>
  cardCurrencyStyles[currency] || {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: 'none',
    accent: '#c4b5fd',
  };
