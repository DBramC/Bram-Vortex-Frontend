import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';

const RequireAuth = () => {
    const token = localStorage.getItem('jwt_token');
    const location = useLocation();

    return token ? (
        <Outlet />
    ) : (
        <Navigate to="/" state={{ from: location }} replace />
    );
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/auth-callback" element={<AuthCallback />} />

                {/* Protected Routes */}
                <Route element={<RequireAuth />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                {/* Catch All */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;