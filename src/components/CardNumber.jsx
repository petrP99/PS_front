import { useState } from 'react';
import { formatCardNumber } from '../utils/cardFormat';

export default function CardNumber({ cardNumber, style }) {
  const [showFullNumber, setShowFullNumber] = useState(false);

  const toggleNumber = (event) => {
    event.stopPropagation();
    setShowFullNumber(value => !value);
  };

  return (
    <button
      type="button"
      title={showFullNumber ? 'Скрыть номер карты' : 'Показать номер карты'}
      onClick={toggleNumber}
      style={{
        padding: 0,
        border: 0,
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        textAlign: 'left',
        ...style,
      }}
    >
      {formatCardNumber(cardNumber, showFullNumber)}
    </button>
  );
}
