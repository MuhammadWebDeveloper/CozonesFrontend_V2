// src/utils/NotFound.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../componentstyles/utilstyle/pagenotfound.css'; // We'll create this CSS file

const NotFound = () => {
    const navigate = useNavigate();

    const goHome = () => {
        navigate('/');
    };

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-animation">
                    <div className="not-found-code">404</div>
                    <div className="not-found-icon">🔍</div>
                </div>

                <h1 className="not-found-title">Oops! Page Not Found</h1>

                <p className="not-found-message">
                    The page you're looking for doesn't exist or has been moved.
                    <br />
                    Let's get you back on track.
                </p>

                <div className="not-found-actions">
                    <button onClick={goHome} className="btn-primary">
                        🏠 Go Back Home
                    </button>
                    <Link to="/" className="btn-secondary">
                        Explore Spaces
                    </Link>
                </div>

                <div className="not-found-suggestions">
                    <p>You might want to check:</p>
                    <ul>
                        <li>✓ The URL for any typos</li>
                        <li>✓ Your internet connection</li>
                        <li>✓ Our <Link to="/" className="suggested-link">spaces</Link> page</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default NotFound;