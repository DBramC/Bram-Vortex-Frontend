import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import AnalyzedRepo from './pages/AnalyzedRepo';
import AnalysisParameters from './pages/AnalysisParameters';
import type { JSX } from "react";

/**
 * 🛡️ REQUIRE AUTH
 * Προστατεύει τα routes που απαιτούν σύνδεση.
 */
const RequireAuth = () => {
    const token = localStorage.getItem('jwt_token');
    const location = useLocation();

    return token ? (
        <Outlet />
    ) : (
        <Navigate to="/" state={{ from: location }} replace />
    );
};

/**
 * 🚪 PUBLIC ROUTE (Guest Only)
 * Αν ο χρήστης είναι ήδη logged in, τον στέλνει στο Dashboard.
 */
const PublicRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('jwt_token');

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* 🌐 PUBLIC ROUTES */}
                <Route
                    path="/"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                <Route path="/auth-callback" element={<AuthCallback />} />

                {/* 🔒 PROTECTED ROUTES */}
                <Route element={<RequireAuth />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* 🚀 FIXED PATH: Τώρα ταιριάζει με το navigate των Parameters */}
                    <Route path="/dashboard/analysis/:jobId" element={<AnalyzedRepo />} />

                    <Route path="/parameters" element={<AnalysisParameters />} />
                </Route>

                {/* 🔄 CATCH ALL - Redirects to home, then RequireAuth/PublicRoute takes over */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;