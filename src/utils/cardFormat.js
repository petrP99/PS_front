export const getCardLastFour = (cardNumber) =>
  cardNumber ? String(cardNumber).slice(-4) : '----';

export const formatCardNumber = (cardNumber, full = false) => {
  const number = String(cardNumber || '');
  if (!number) return 'Номер не указан';

  if (!full) {
    return `•••• •••• •••• ${getCardLastFour(number)}`;
  }

  return number.replace(/(\d{4})(?=\d)/g, '$1 ');
};

export const formatExpireDate = (expireDate) => {
  if (!expireDate) return '—';

  const [year, month] = String(expireDate).split('-');
  if (!year || !month) return expireDate;

  return `${month}/${year.slice(-2)}`;
};
