import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';

// Σβήσαμε τα import για τα logos και το CSS γιατί δεν τα θέλουμε πια

function App() {
    return (
        <Router>
            <Routes>
                {/* Η αρχική σελίδα είναι το Login */}
                <Route path="/" element={<Login />} />

                {/* Εδώ επιστρέφει ο χρήστης από το GitHub */}
                <Route path="/auth-callback" element={<AuthCallback />} />

                {/* Η προστατευμένη σελίδα */}
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;