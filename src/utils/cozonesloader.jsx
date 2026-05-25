// components/common/Loader.jsx
import React from 'react';
import '../componentstyles/utilstyle/loader.css';

const Loader = ({ size = 'medium', text = '' }) => {
    return (
        <div className={`loader-container loader-${size}`}>
            <div className="loader-spinner"></div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
};

export default Loader;