import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="app-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
    <h1>404</h1>
    <p>We couldn&apos;t find that page.</p>
    <Link className="btn btn-primary" to="/login">
      Back to login
    </Link>
  </div>
);

export default NotFoundPage;

