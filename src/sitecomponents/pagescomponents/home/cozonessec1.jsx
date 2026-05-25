// homeislam.jsx
import React, { useState, useEffect } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
// import PropertyCard from '../../../utils/viewcard'; // Import the PropertyCard component
import './../../../componentstyles/homestyle/Cozonessec_1.css';

const Cozonessec_1 = () => {
    return (
        <section className="Cozonessec_1_popular-homes-section">
            <div className="Cozonessec_1_popular-homes-container">
                <div className="Cozonessec_1_popular-homes-header">
                    <div>
                        <h2 className="Cozonessec_1_popular-homes-title">Popular Spaces in Pakistan</h2>
                        <p className="Cozonessec_1_popular-homes-subtitle">
                            Discover the most loved places to stay in the capital city
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Cozonessec_1;