import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Профиль
      </h1>
      <div className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #6366f1, #c084fc)',
          fontSize: '1.7rem',
          fontWeight: 700,
        }}>
          {(user?.firstName || user?.preferred_username || 'U')[0].toUpperCase()}
        </div>
        <ProfileRow label="Имя" value={user?.firstName || 'Не указано'} />
        <ProfileRow label="Фамилия" value={user?.lastName || 'Не указано'} />
        <ProfileRow label="Телефон" value={formatPhone(user?.phone)} />
      </div>
    </div>
  );
}

function ProfileRow({ label, value, last = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.9rem 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

function formatPhone(value) {
  if (!value) return 'Не указан';
  const digits = String(value).replace(/\D/g, '');
  return digits.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
}
