import { useNavigate, useParams } from 'react-router-dom';

const MEME_URL = 'https://cdn1.tenchat.ru/static/vbc-gostinder/2024-05-11/d32b5248-4f32-4e0d-bfc6-458aa5c0df3b.png?width=2094&height=2097&fmt=webp';

export default function AccountRequisitesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="glass" style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem', textAlign: 'center', borderRadius: '20px' }}>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 700 }}>
          Эту хуйню мне было уже лень дописывать
        </h1>

        <img
          src={MEME_URL}
          alt="Мем о незавершенных реквизитах счета"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '520px',
            margin: '0 auto 1.5rem',
            borderRadius: '16px',
            objectFit: 'contain',
          }}
        />

        <button
          type="button"
          className="glass"
          onClick={() => navigate(`/accounts/${id}`)}
          style={{
            padding: '0.75rem 1.5rem',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '10px',
            background: 'rgba(99,102,241,0.2)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Вернуться к счету
        </button>
      </div>
    </div>
  );
}
