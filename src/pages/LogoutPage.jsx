import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LogoutPage() {
  const navigate = useNavigate();

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-primary" />
      <div className="auth-orb auth-orb-secondary" />

      <section className="auth-card glass glow-border">
        <div className="auth-status-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m7 12 3 3 7-7" />
          </svg>
        </div>
        <h1 className="auth-title">Вы вышли из аккаунта</h1>
        <p className="auth-subtitle auth-logout-copy">
          Сессия завершена. Для продолжения работы войдите снова.
        </p>
        <button
          className="auth-button auth-button-primary"
          type="button"
          onClick={() => navigate('/login')}
        >
          Войти снова
        </button>
      </section>
    </main>
  );
}
