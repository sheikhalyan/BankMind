import { useAuth } from './context/AuthContext';
import { Router } from './components/Router';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getDashboard = () => {
    if (!isAuthenticated || !user) return <Login />;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'user':
        return <UserDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        return <Login />;
    }
  };

  const routes = [
    { path: '/', element: getDashboard() },
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    {
      path: '/admin',
      element: (
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/user',
      element: (
        <ProtectedRoute allowedRoles={['user']}>
          <UserDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/customer',
      element: (
        <ProtectedRoute allowedRoles={['customer']}>
          <CustomerDashboard />
        </ProtectedRoute>
      ),
    },
  ];

  return <Router routes={routes} />;
}

export default App;
