import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import type { Lecture } from '../../types';

const InstructorDashboard = () => {
  const { user, logout } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const fetchLectures = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Lecture[]>('/api/instructors/me/lectures');
      setLectures(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load lectures';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  const filteredLectures = useMemo(() => {
    const today = new Date();
    return lectures.filter((lecture) => {
      const date = new Date(lecture.date);
      if (filter === 'upcoming') return date >= today;
      if (filter === 'past') return date < today;
      return true;
    });
  }, [lectures, filter]);

  return (
    <>
      <header
        style={{
          background: '#111827',
          color: '#fff',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Instructor Dashboard</h2>
          <p style={{ margin: 0, color: '#d1d5db' }}>Your assigned lectures</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong>{user?.name}</strong>
          <div style={{ fontSize: 12 }}>{user?.email}</div>
          <button className="btn btn-outline" style={{ marginTop: '0.5rem', color: '#fff', borderColor: '#fff' }} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-content">
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>My Lectures</h2>
              <small style={{ color: '#6b7280' }}>Stay on top of your upcoming sessions</small>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => setFilter('all')} style={{ borderColor: filter === 'all' ? '#2563eb' : undefined }}>
                All
              </button>
              <button className="btn btn-outline" onClick={() => setFilter('upcoming')} style={{ borderColor: filter === 'upcoming' ? '#2563eb' : undefined }}>
                Upcoming
              </button>
              <button className="btn btn-outline" onClick={() => setFilter('past')} style={{ borderColor: filter === 'past' ? '#2563eb' : undefined }}>
                Past
              </button>
            </div>
          </div>

          {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
          {loading ? (
            <p>Loading lectures...</p>
          ) : filteredLectures.length === 0 ? (
            <p>No lectures to show.</p>
          ) : (
            <div className="grid" style={{ marginTop: '1rem', gap: '1rem' }}>
              {filteredLectures.map((lecture) => (
                <article
                  key={lecture._id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '1rem',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0' }}>{lecture.course?.name}</h3>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>{lecture.course?.level}</span>
                    </div>
                    <div>
                      <span className={`status-badge status-${lecture.status}`}>{lecture.status}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', color: '#4b5563' }}>
                    <p style={{ margin: '0 0 0.25rem 0' }}>Date: {new Date(lecture.date).toLocaleDateString()}</p>
                    <p style={{ margin: '0 0 0.25rem 0' }}>
                      Time: {lecture.startTime} - {lecture.endTime}
                    </p>
                    <p style={{ margin: 0 }}>Batch: {lecture.batchName || '—'}</p>
                  </div>
                  {lecture.course?.description && (
                    <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>{lecture.course.description}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default InstructorDashboard;

