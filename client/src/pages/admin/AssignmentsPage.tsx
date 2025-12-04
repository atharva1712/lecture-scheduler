import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import apiClient from '../../services/api';
import type { Lecture, User } from '../../types';

interface AssignmentForm {
  lectureId: string;
  instructorId: string;
  date: string;
}

const defaultForm: AssignmentForm = {
  lectureId: '',
  instructorId: '',
  date: '',
};

const AssignmentsPage = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [form, setForm] = useState<AssignmentForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lecturesResponse, instructorsResponse] = await Promise.all([
        apiClient.get<Lecture[]>('/api/lectures'),
        apiClient.get<User[]>('/api/admin/instructors'),
      ]);
      setLectures(lecturesResponse.data);
      setInstructors(instructorsResponse.data);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Failed to load assignments';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiClient.post(`/api/lectures/${form.lectureId}/assign`, {
        instructorId: form.instructorId,
        date: form.date,
      });
      setMessage('Lecture assignment updated successfully');
      setForm(defaultForm);
      await loadData();
    } catch (err) {
      const response = (err as any)?.response;
      const messageText = response?.data?.message || 'Failed to assign lecture';
      setError(messageText);
    } finally {
      setSaving(false);
    }
  };

  const assignedLectures = lectures.filter((lecture) => lecture.instructor);

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Assign lecture to instructor</h2>
        <form className="grid" style={{ gap: '0.75rem' }} onSubmit={handleSubmit}>
          {message && <div style={{ color: '#16a34a' }}>{message}</div>}
          {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

          <label className="grid" style={{ gap: 4 }}>
            <span>Lecture</span>
            <select
              className="select"
              required
              value={form.lectureId}
              onChange={(e) => setForm((prev) => ({ ...prev, lectureId: e.target.value }))}
            >
              <option value="">Select lecture</option>
              {lectures.map((lecture) => (
                <option key={lecture._id} value={lecture._id}>
                  {lecture.course?.name} — {lecture.batchName || 'Batch'} ({lecture.startTime}-{lecture.endTime})
                </option>
              ))}
            </select>
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Instructor</span>
            <select
              className="select"
              required
              value={form.instructorId}
              onChange={(e) => setForm((prev) => ({ ...prev, instructorId: e.target.value }))}
            >
              <option value="">Select instructor</option>
              {instructors.map((inst) => {
                const value = inst.id || inst._id;
                return (
                  <option key={value} value={value}>
                    {inst.name}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Date</span>
            <input
              className="input"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Assigning...' : 'Assign lecture'}
          </button>
        </form>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Assigned lectures</h2>
          <small style={{ color: '#6b7280' }}>{assignedLectures.length} assignments</small>
        </div>
        {loading ? (
          <p>Loading assignments...</p>
        ) : assignedLectures.length === 0 ? (
          <p>No assignments yet.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedLectures.map((lecture) => (
                  <tr key={lecture._id}>
                    <td>{lecture.course?.name}</td>
                    <td>{lecture.instructor?.name}</td>
                    <td>{new Date(lecture.date).toLocaleDateString()}</td>
                    <td>
                      {lecture.startTime} - {lecture.endTime}
                    </td>
                    <td>
                      <span className={`status-badge status-${lecture.status}`}>{lecture.status}</span>
                    </td>
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

export default AssignmentsPage;

