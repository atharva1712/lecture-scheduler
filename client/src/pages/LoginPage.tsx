import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: Location })?.from?.pathname;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const loggedInUser = await login({ email, password });
      const destination = from || (loggedInUser.role === 'admin' ? '/admin' : '/instructor');
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    }
  };

  return (
    <div className="app-content" style={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Welcome back</h1>
        <p style={{ marginTop: 0, color: '#6b7280' }}>Sign in to manage lectures and schedules.</p>

        <form className="grid" style={{ marginTop: '1.5rem' }} onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 8, fontSize: 14 }}>
              {error}
            </div>
          )}

          <label className="grid" style={{ gap: 4 }}>
            <span>Email</span>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Password</span>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

