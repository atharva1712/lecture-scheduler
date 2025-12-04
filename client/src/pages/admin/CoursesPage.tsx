import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import apiClient from '../../services/api';
import type { Course } from '../../types';

const emptyForm = {
  name: '',
  level: '',
  description: '',
  imageFile: null as File | null,
};

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Course[]>('/api/courses');
      setCourses(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load courses';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCourse(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('level', form.level);
      formData.append('description', form.description);
      if (form.imageFile) {
        formData.append('image', form.imageFile);
      }

      if (editingCourse) {
        await apiClient.put(`/api/courses/${editingCourse._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await apiClient.post('/api/courses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      await fetchCourses();
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save course';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      await apiClient.delete(`/api/courses/${id}`);
      await fetchCourses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete course';
      setError(message);
    }
  };

  const startEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      level: course.level,
      description: course.description,
      imageFile: null,
    });
  };

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>{editingCourse ? 'Update course' : 'Add a new course'}</h2>
        <form className="grid" style={{ gap: '0.75rem' }} onSubmit={handleSubmit}>
          {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

          <label className="grid" style={{ gap: 4 }}>
            <span>Course name</span>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Level</span>
            <input
              className="input"
              value={form.level}
              onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}
              required
            />
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Description</span>
            <textarea
              className="textarea"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </label>

          <label className="grid" style={{ gap: 4 }}>
            <span>Image</span>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] ?? null }))}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingCourse ? 'Update course' : 'Add course'}
            </button>
            {editingCourse && (
              <button className="btn btn-outline" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Courses</h2>
          <small style={{ color: '#6b7280' }}>{courses.length} total</small>
        </div>

        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          <div className="grid grid-2" style={{ marginTop: '1rem' }}>
            {courses.map((course) => (
              <article
                key={course._id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '1rem',
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0' }}>{course.name}</h3>
                    <span style={{ padding: '0.1rem 0.4rem', borderRadius: 6, background: '#e0f2fe', fontSize: 12 }}>
                      {course.level}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" type="button" onClick={() => startEdit(course)}>
                      Edit
                    </button>
                    <button className="btn btn-outline" type="button" onClick={() => handleDelete(course._id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p style={{ color: '#4b5563' }}>{course.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CoursesPage;

