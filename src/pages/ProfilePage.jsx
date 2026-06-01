import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getProfile()
      .then(data => {
        setProfile(data);
        setForm({ firstName: data.firstName || '', lastName: data.lastName || '', phone: data.phone || '' });
      })
      .catch(() => setError('Ошибка загрузки профиля'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile(form);
      setSuccess('Профиль успешно обновлён');
      const updated = await getProfile();
      setProfile(updated);
    } catch (err) {
      setError(err.message || 'Ошибка при обновлении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Загрузка профиля...</div>;

  return (
    <div>
      <h1 className="page-title">👤 Профиль</h1>

      <div className="card" style={{ maxWidth: 600 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Имя</label>
              <input
                type="text"
                name="firstName"
                className="form-control"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input
                type="text"
                name="lastName"
                className="form-control"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={profile?.email || ''}
              disabled
              style={{ background: '#f0f0f0' }}
            />
            <small style={{ color: '#888' }}>Email нельзя изменить</small>
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="text"
              name="phone"
              className="form-control"
              value={form.phone}
              onChange={handleChange}
              placeholder="+79XXXXXXXXX"
              pattern="\+79\d{9}"
              title="Формат: +79XXXXXXXXX"
            />
          </div>

          <button type="submit" className="btn" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>

      {profile && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-title">📋 Текущие данные</div>
          <table>
            <tbody>
              <tr><td><strong>ID</strong></td><td>{profile.id}</td></tr>
              <tr><td><strong>Email</strong></td><td>{profile.email}</td></tr>
              <tr><td><strong>Имя</strong></td><td>{profile.firstName} {profile.lastName}</td></tr>
              <tr><td><strong>Телефон</strong></td><td>{profile.phone || '—'}</td></tr>
              <tr><td><strong>Роль</strong></td><td>
                <span className={`badge ${profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN' ? 'badge-warning' : 'badge-info'}`}>
                  {profile.role || 'USER'}
                </span>
              </td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}