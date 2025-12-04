import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import CoursesPage from './pages/admin/CoursesPage';
import LecturesPage from './pages/admin/LecturesPage';
import AssignmentsPage from './pages/admin/AssignmentsPage';
import InstructorsPage from './pages/admin/InstructorsPage';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="courses" replace />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="lectures" element={<LecturesPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="instructors" element={<InstructorsPage />} />
        </Route>

        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default App;

