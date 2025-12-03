import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('jwt_token');
        if (!storedToken) {
            navigate('/'); // Αν δεν έχει token, πέτα τον έξω
        } else {
            setToken(storedToken);
        }
    }, [navigate]);

    return (
        <div style={{ padding: '40px' }}>
            <h1>🚀 Dashboard</h1>
            <p>Welcome, Developer! You are authenticated.</p>
            <p>Your Session Token:</p>
            <textarea readOnly rows={5} style={{ width: '100%' }} value={token || ''} />

            <br /><br />
            <button onClick={() => {
                localStorage.removeItem('jwt_token');
                navigate('/');
            }}>Logout</button>
        </div>
    );
};

export default Dashboard;