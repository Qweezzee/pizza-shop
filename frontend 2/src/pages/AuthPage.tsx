import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result =
        mode === 'login'
          ? await authApi.login({ email: form.email, password: form.password })
          : await authApi.register(form);

      login(result.token, result.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить запрос');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <div className="auth-card__header">
          <h1>{mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h1>
          <p>После входа будут доступны корзина, оформление заказа и история.</p>
        </div>

        <form className="form stack-md" onSubmit={submit}>
          {mode === 'register' && (
            <input
              className="input"
              placeholder="Имя пользователя"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            />
          )}
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Пароль"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />

          {error && <div className="error-box">{error}</div>}

          <button className="button" disabled={loading}>
            {loading ? 'Подожди...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <button className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </section>
    </div>
  );
}
