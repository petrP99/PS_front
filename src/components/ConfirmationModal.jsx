import React from 'react';

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div className="glass" style={{
        padding: '2rem',
        borderRadius: '16px',
        maxWidth: '450px',
        width: '90%',
        animation: 'scaleIn 0.3s ease-out',
      }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>{title}</h2>
        <p style={{ marginBottom: '2rem', color: 'rgba(255,255,255,0.7)' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            className="glass" 
            style={{ padding: '0.7rem 1.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer' }}
            onClick={onCancel}
          >
            Отмена
          </button>
          <button 
            className="glass" 
            style={{ padding: '0.7rem 1.5rem', background: 'rgba(236,72,153,0.2)', border: '1px solid rgba(236,72,153,0.4)', borderRadius: '10px', cursor: 'pointer' }}
            onClick={onConfirm}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}