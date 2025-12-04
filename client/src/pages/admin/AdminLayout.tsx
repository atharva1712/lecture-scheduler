import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Courses', path: 'courses' },
  { label: 'Lectures', path: 'lectures' },
  { label: 'Assignments', path: 'assignments' },
  { label: 'Instructors', path: 'instructors' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Admin Console</h2>
          <small style={{ color: '#6b7280' }}>Manage courses, lectures & assignments</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <strong>{user?.name}</strong>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{user?.email}</div>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav
        style={{
          background: '#111827',
          color: '#fff',
          display: 'flex',
          gap: '1rem',
          padding: '0.75rem 2rem',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              color: isActive ? '#60a5fa' : '#e5e7eb',
              fontWeight: isActive ? 600 : 500,
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
};

export default AdminLayout;

