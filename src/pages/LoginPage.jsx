import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const handleLogin = login;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-20%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 10s ease-in-out infinite reverse' }} />

      <div className="glass glow-border" style={{ padding: '3rem 2.5rem', textAlign: 'center', maxWidth: '380px', width: '90%', position: 'relative', animation: 'fadeInUp 0.6s ease-out' }}>
        <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #6366f1, #c084fc, #f472b6)', backgroundSize: '200% 200%', animation: 'gradientShift 4s ease infinite', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem', boxShadow: '0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)' }}>✦</div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Pay<span style={{ color: '#818cf8' }}>Flow</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '2.5rem', lineHeight: 1.5 }}>
          Футуристическая платёжная система
        </p>

        <button onClick={handleLogin} style={{ padding: '1rem 0', width: '100%', background: 'linear-gradient(135deg, #6366f1, #c084fc)', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
          onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5)'; }}
          onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)'; }}>
          Войти через Keycloak
        </button>

        <p style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
          🔒 ЗАЩИЩЕНО · OAuth 2.0
        </p>
      </div>
    </div>
  );
}