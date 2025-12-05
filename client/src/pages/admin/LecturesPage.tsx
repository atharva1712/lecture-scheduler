import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import apiClient from '../../services/api';
import type { Course, Lecture, User } from '../../types';

interface LectureFormState {
  course: string;
  instructor: string;
  date: string;
  startTime: string;
  endTime: string;
  batchName: string;
}

const defaultForm: LectureFormState = {
  course: '',
  instructor: '',
  date: '',
  startTime: '',
  endTime: '',
  batchName: '',
};

const LecturesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [form, setForm] = useState<LectureFormState>(defaultForm);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Check if selected date is today
  const isToday = () => {
    if (!form.date) return false;
    const today = new Date().toISOString().split('T')[0];
    return form.date === today;
  };

  // Validate timings before submit
  const validateTimings = () => {
    if (!form.startTime || !form.endTime) return true;
    
    const [startHours, startMinutes] = form.startTime.split(':').map(Number);
    const [endHours, endMinutes] = form.endTime.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (startTotal >= endTotal) {
      setError('Start time must be before end time');
      return false;
    }

    // If scheduling for today, check if times are in the past
    if (isToday() && form.date) {
      const currentTime = getCurrentTime();
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const currentTotal = currentHours * 60 + currentMinutes;

      if (startTotal < currentTotal) {
        setError('Start time cannot be in the past for today\'s lectures');
        return false;
      }
      if (endTotal <= currentTotal) {
        setError('End time cannot be in the past for today\'s lectures');
        return false;
      }
    }

    return true;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, instructorsRes, lecturesRes] = await Promise.all([
        apiClient.get<Course[]>('/api/courses'),
        apiClient.get<User[]>('/api/admin/instructors'),
        apiClient.get<Lecture[]>('/api/lectures'),
      ]);
      setCourses(coursesRes.data);
      setInstructors(instructorsRes.data);
      setLectures(lecturesRes.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load lectures';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingLecture(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Validate timings
    if (!validateTimings()) {
      setSaving(false);
      return;
    }

    try {
      const payload = {
        course: form.course,
        instructor: form.instructor,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        batchName: form.batchName,
      };

      if (editingLecture) {
        await apiClient.put(`/api/lectures/${editingLecture._id}`, payload);
        setSuccessMessage('Lecture updated successfully');
      } else {
        await apiClient.post('/api/lectures', payload);
        setSuccessMessage('Lecture created successfully');
      }

      await loadData();
      resetForm();
    } catch (err) {
      if (err instanceof Error && 'response' in err) {
        const axiosError = err as any;
        const message = axiosError.response?.data?.message || 'Failed to save lecture';
        setError(message);
      } else {
        const message = err instanceof Error ? err.message : 'Failed to save lecture';
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lecture?')) return;
    try {
      await apiClient.delete(`/api/lectures/${id}`);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lecture';
      setError(message);
    }
  };

  const startEdit = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setForm({
      course: lecture.course?._id || '',
      instructor: lecture.instructor?._id || '',
      date: lecture.date?.split('T')[0] || '',
      startTime: lecture.startTime,
      endTime: lecture.endTime,
      batchName: lecture.batchName || '',
    });
  };

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{editingLecture ? 'Update lecture' : 'Schedule lecture'}</h2>
          {successMessage && <span style={{ color: '#16a34a' }}>{successMessage}</span>}
        </div>
        <form className="grid" style={{ gap: '0.75rem' }} onSubmit={handleSubmit}>
          {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

          <label className="grid" style={{ gap: 4 }}>
            <span>Course</span>
            <select
              className="select"
              required
              value={form.course}
              onChange={(e) => setForm((prev) => ({ ...prev, course: e.target.value }))}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Instructor</span>
            <select
              className="select"
              required
              value={form.instructor}
              onChange={(e) => setForm((prev) => ({ ...prev, instructor: e.target.value }))}
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

          <div className="grid grid-2">
            <label className="grid" style={{ gap: 4 }}>
              <span>Date</span>
              <input
                className="input"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={form.date}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, date: e.target.value }));
                  setError(null);
                }}
              />
            </label>
            <label className="grid" style={{ gap: 4 }}>
              <span>Batch name</span>
              <input
                className="input"
                value={form.batchName}
                onChange={(e) => setForm((prev) => ({ ...prev, batchName: e.target.value }))}
                placeholder="Morning Batch"
              />
            </label>
          </div>

          <div className="grid grid-2">
            <label className="grid" style={{ gap: 4 }}>
              <span>Start time</span>
              <input
                className="input"
                type="time"
                required
                min={isToday() ? getCurrentTime() : undefined}
                value={form.startTime}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, startTime: e.target.value }));
                  setError(null);
                }}
              />
            </label>

            <label className="grid" style={{ gap: 4 }}>
              <span>End time</span>
              <input
                className="input"
                type="time"
                required
                min={isToday() && form.startTime ? form.startTime : (isToday() ? getCurrentTime() : undefined)}
                value={form.endTime}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, endTime: e.target.value }));
                  setError(null);
                }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingLecture ? 'Update lecture' : 'Add lecture'}
            </button>
            {editingLecture && (
              <button className="btn btn-outline" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>All lectures</h2>
          <small style={{ color: '#6b7280' }}>{lectures.length} scheduled</small>
        </div>

        {loading ? (
          <p>Loading lectures...</p>
        ) : lectures.length === 0 ? (
          <p>No lectures scheduled yet.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lectures.map((lecture) => (
                  <tr key={lecture._id}>
                    <td>{lecture.course?.name}</td>
                    <td>{lecture.instructor?.name || 'Unassigned'}</td>
                    <td>{new Date(lecture.date).toLocaleDateString()}</td>
                    <td>
                      {lecture.startTime} - {lecture.endTime}
                    </td>
                    <td>{lecture.batchName || '—'}</td>
                    <td>
                      <span className={`status-badge status-${lecture.status}`}>{lecture.status}</span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" type="button" onClick={() => startEdit(lecture)}>
                        Edit
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => handleDelete(lecture._id)}>
                        Delete
                      </button>
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

export default LecturesPage;

