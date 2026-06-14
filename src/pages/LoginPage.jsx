import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-primary" />
      <div className="auth-orb auth-orb-secondary" />

      <section className="auth-card glass glow-border">
        <div className="auth-logo" aria-hidden="true">P</div>

        <h1 className="auth-brand">
          Pay<span style={{ color: '#818cf8' }}>Flow</span>
        </h1>
        <p className="auth-subtitle">
          Управляйте счетами, переводами и платежами в одном месте
        </p>

        <button className="auth-button auth-button-primary" type="button" onClick={login}>
          Войти
        </button>
        <button className="auth-button auth-button-secondary" type="button" onClick={register}>
          Создать аккаунт
        </button>

        <p className="auth-security">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z" />
          </svg>
          Безопасная авторизация OAuth 2.0
        </p>
      </section>
    </main>
  );
}
