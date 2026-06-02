import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    { icon: '💳', title: 'Переводы по карте', desc: 'Мгновенные переводы', glow: 'rgba(99,102,241,0.3)' },
    { icon: '📱', title: 'Переводы по телефону', desc: 'По номеру телефона', glow: 'rgba(236,72,153,0.3)' },
    { icon: '💰', title: 'Пополнения', desc: 'Пополнить счёт', glow: 'rgba(6,182,212,0.3)' },
    { icon: '🧾', title: 'Оплата услуг', desc: 'Интернет, ЖКХ', glow: 'rgba(16,185,129,0.3)' },
    { icon: '🏦', title: 'Мои карты', desc: 'Управление картами', glow: 'rgba(245,158,11,0.3)' },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {/* Баланс карточка */}
      {user && (
        <div className="glass glow-border" style={{
          padding: '2rem 2.5rem', marginBottom: '2rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40%', right: '-10%',
            width: '300px', height: '300px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Ваш баланс
            </span>
            <h1 style={{
              fontSize: '2.8rem', fontWeight: 800, margin: '0.5rem 0',
              background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 4s ease infinite',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px',
            }}>
              {user.balance !== undefined ? `${Number(user.balance).toLocaleString('ru-RU')} ₽` : '—'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              {user.preferred_username} · {new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>
      )}

      {/* Быстрые действия */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', letterSpacing: '0.5px' }}>
        БЫСТРЫЕ ДЕЙСТВИЯ
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {['➕ Создать карту', '⚡ Перевести', '📋 Выписка'].map((item, i) => (
          <div key={i} className="glass" style={{
            padding: '1.2rem', cursor: 'pointer', textAlign: 'center',
            animation: `fadeInUp 0.5s ${0.1 + i * 0.1}s ease-out both`,
          }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{item.split(' ')[0]}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.slice(2)}</div>
          </div>
        ))}
      </div>

      {/* Услуги */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', letterSpacing: '0.5px' }}>
        УСЛУГИ
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {features.map((f, i) => (
          <div key={i} className="glass glow-border" style={{
            padding: '1.5rem', cursor: 'pointer',
            animation: `fadeInUp 0.5s ${0.2 + i * 0.1}s ease-out both`,
            boxShadow: `0 0 30px ${f.glow}`,
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.8rem', animation: 'float 4s ease-in-out infinite' }}>{f.icon}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e8e8f0', marginBottom: '0.3rem' }}>{f.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}