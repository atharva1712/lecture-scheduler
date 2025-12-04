import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import apiClient from '../../services/api';
import type { User } from '../../types';

interface InstructorFormState {
  name: string;
  email: string;
  password: string;
}

const defaultForm: InstructorFormState = {
  name: '',
  email: '',
  password: '',
};

const InstructorsPage = () => {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [form, setForm] = useState<InstructorFormState>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInstructors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<User[]>('/api/admin/instructors');
      setInstructors(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load instructors';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstructors();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'instructor',
      });
      setSuccess('Instructor created successfully. Share the email and password with them so they can log in.');
      setForm(defaultForm);
      await loadInstructors();
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to create instructor');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Add instructor</h2>
        <p style={{ marginTop: 0, color: '#6b7280' }}>
          Create an instructor account by providing their name, email and a temporary password.
        </p>

        <form className="grid" style={{ gap: '0.75rem' }} onSubmit={handleSubmit}>
          {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
          {success && <div style={{ color: '#16a34a' }}>{success}</div>}

          <label className="grid" style={{ gap: 4 }}>
            <span>Name</span>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Instructor name"
            />
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              placeholder="instructor@example.com"
            />
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              placeholder="Temporary password"
              minLength={6}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create instructor'}
          </button>
        </form>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>All instructors</h2>
          <small style={{ color: '#6b7280' }}>{instructors.length} total</small>
        </div>

        {loading ? (
          <p>Loading instructors...</p>
        ) : instructors.length === 0 ? (
          <p>No instructors yet. Add one using the form above.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((inst) => (
                  <tr key={inst._id || inst.id}>
                    <td>{inst.name}</td>
                    <td>{inst.email}</td>
                    <td>{inst.role}</td>
                    <td>{/* createdAt not in User type; backend returns it, so show if present */}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default InstructorsPage;


