import React, { useEffect, useState } from 'react';

export default function Toast({ message, visible, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!show && !visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '0.8rem 2rem',
        background: 'rgba(34,197,94,0.15)',
        border: '1px solid rgba(34,197,94,0.4)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 500,
        backdropFilter: 'blur(10px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
}