import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import AnalyzedRepo from './pages/AnalyzedRepo';
import AnalysisParameters from './pages/AnalysisParameters';
import type {JSX} from "react";

/**
 * 🛡️ REQUIRE AUTH
 * Προστατεύει τα routes που απαιτούν σύνδεση.
 * Αν δεν υπάρχει token, στέλνει τον χρήστη στο Login (/).
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
 * Χρησιμοποιείται για τη σελίδα Login.
 * Αν ο χρήστης ΕΧΕΙ token, τον "πετάει" αυτόματα στο Dashboard.
 */
const PublicRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('jwt_token');

    if (token) {
        // Αν είναι ήδη συνδεδεμένος, δεν έχει λόγο να βλέπει το Login
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* 🌐 PUBLIC ROUTES
                   Το "/" είναι πλέον προστατευμένο από το PublicRoute:
                   Αν είσαι login -> Πας Dashboard.
                   Αν όχι -> Βλέπεις τη σελίδα Login.
                */}
                <Route
                    path="/"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                {/* Το callback πρέπει να είναι προσβάσιμο για να ολοκληρωθεί το login */}
                <Route path="/auth-callback" element={<AuthCallback />} />

                {/* 🔒 PROTECTED ROUTES
                   Όλα τα παρακάτω απαιτούν έγκυρο jwt_token στο localStorage.
                */}
                <Route element={<RequireAuth />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analyzed-repo/:jobId" element={<AnalyzedRepo />} />
                    <Route path="/parameters" element={<AnalysisParameters />} />
                </Route>

                {/* 🔄 CATCH ALL
                   Οτιδήποτε άλλο path οδηγεί στην αρχική,
                   η οποία με τη σειρά της θα σε κάνει redirect βάσει του token.
                */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;