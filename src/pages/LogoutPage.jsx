import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LogoutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', right: '10%', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 7s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 9s ease-in-out infinite reverse' }} />

      <div className="glass glow-border" style={{ padding: '3rem 2.5rem', textAlign: 'center', maxWidth: '380px', width: '90%', animation: 'fadeInUp 0.6s ease-out' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'float 4s ease-in-out infinite' }}>👋</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>Вы вышли</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Спасибо, что пользуетесь PayFlow.<br />До встречи!
        </p>
        <button onClick={() => navigate('/login')} style={{ padding: '1rem 0', width: '100%', background: 'linear-gradient(135deg, #6366f1, #c084fc)', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
          onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5)'; }}
          onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)'; }}>
          Войти снова
        </button>
      </div>
    </div>
  );
}