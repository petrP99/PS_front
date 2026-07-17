export const cardCurrencyStyles = {
  RUB: {
    background: 'rgba(13, 19, 20, 0.97)',
    border: '1px solid rgba(109, 214, 255, 0.24)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 44px rgba(0,0,0,0.24)',
    accent: '#6dd6ff',
    accentSoft: 'rgba(109, 214, 255, 0.08)',
    accentBorder: 'rgba(109, 214, 255, 0.28)',
  },
  USD: {
    background: 'rgba(13, 20, 17, 0.97)',
    border: '1px solid rgba(140, 242, 155, 0.24)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 44px rgba(0,0,0,0.24)',
    accent: '#8cf29b',
    accentSoft: 'rgba(140, 242, 155, 0.08)',
    accentBorder: 'rgba(140, 242, 155, 0.28)',
  },
  CNY: {
    background: 'rgba(21, 19, 13, 0.97)',
    border: '1px solid rgba(245, 199, 107, 0.24)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 44px rgba(0,0,0,0.24)',
    accent: '#f5c76b',
    accentSoft: 'rgba(245, 199, 107, 0.08)',
    accentBorder: 'rgba(245, 199, 107, 0.28)',
  },
};

export const getCardCurrencyStyle = (currency) =>
  cardCurrencyStyles[currency] || {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 44px rgba(0,0,0,0.24)',
    accent: '#8cf29b',
    accentSoft: 'rgba(140, 242, 155, 0.08)',
    accentBorder: 'rgba(140, 242, 155, 0.28)',
  };
