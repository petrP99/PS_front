import React from 'react';

export default function AdminPage() {
  return (
    <div className="fade-in">
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '2.5rem',
        marginBottom: '2rem',
        color: '#fff',
        boxShadow: '0 10px 40px rgba(102,126,234,0.3)',
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Admin Panel</h1>
        <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>This page is accessible only to administrators.</p>
      </div>
    </div>
  );
}