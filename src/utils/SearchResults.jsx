// components/search/SearchResults.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BaseUrl from '../utils/AppConstants.jsx';
import "../componentstyles/utilstyle/searchResults.css";

const SearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useState({});

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchCriteria = {
            destination: params.get('destination') || '',
            type: params.get('type') || '',
            startTime: params.get('startTime') || '',
            endTime: params.get('endTime') || ''
        };
        setSearchParams(searchCriteria);
        performSearch(searchCriteria);
    }, [location.search]);

    const performSearch = async (criteria) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const apiClient = axios.create({
                baseURL: BaseUrl,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            const unitTypes = ['open_desks', 'dedicated_desks', 'private_cabins', 'meeting_rooms'];
            const allSpaces = [];

            const promises = unitTypes.map(type =>
                apiClient.get(`api/spaces/unit/${type}`).catch(err => {
                    console.warn(`Failed to fetch ${type}:`, err);
                    return { data: { success: false, units: [] } };
                })
            );

            const responses = await Promise.all(promises);

            responses.forEach(response => {
                if (response.data?.success && response.data?.units?.length > 0) {
                    response.data.units.forEach(unit => {
                        if (unit.is_active) {
                            // FIXED: Better image handling
                            let imageUrl = null;
                            
                            // Check multiple possible image locations
                            if (unit.images && Array.isArray(unit.images) && unit.images.length > 0) {
                                // If images is an array of strings
                                if (typeof unit.images[0] === 'string') {
                                    imageUrl = unit.images[0];
                                }
                                // If images is an array of objects with url property
                                else if (unit.images[0]?.url) {
                                    imageUrl = unit.images[0].url;
                                }
                                // If images is an array of objects with image_url property
                                else if (unit.images[0]?.image_url) {
                                    imageUrl = unit.images[0].image_url;
                                }
                            }
                            // Check for single image field
                            else if (unit.image) {
                                imageUrl = unit.image;
                            }
                            else if (unit.image_url) {
                                imageUrl = unit.image_url;
                            }
                            
                            // If image URL doesn't start with http, prepend BaseUrl
                            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                                imageUrl = `${BaseUrl}${imageUrl}`;
                            }
                            
                            // Get best rate
                            let price = null;
                            let priceDisplay = 'Contact for pricing';
                            if (unit.hourly_rate && parseFloat(unit.hourly_rate) > 0) {
                                price = parseFloat(unit.hourly_rate);
                                priceDisplay = `PKR ${price.toLocaleString()}/hour`;
                            } else if (unit.daily_rate && parseFloat(unit.daily_rate) > 0) {
                                price = parseFloat(unit.daily_rate);
                                priceDisplay = `PKR ${price.toLocaleString()}/day`;
                            } else if (unit.monthly_rate && parseFloat(unit.monthly_rate) > 0) {
                                price = parseFloat(unit.monthly_rate);
                                priceDisplay = `PKR ${price.toLocaleString()}/month`;
                            }
                            
                            allSpaces.push({
                                id: unit.id,
                                title: unit.name || unit.unit_type?.replace('_', ' ') || 'Space',
                                location: unit.city || unit.address || 'Location available',
                                price: price,
                                priceDisplay: priceDisplay,
                                unit_type: unit.unit_type,
                                images: imageUrl,
                                capacity: unit.total_capacity || unit.capacity || 1,
                                rating: unit.rating || 4.5
                            });
                        }
                    });
                }
            });

            // Apply filters
            let filteredSpaces = [...allSpaces];

            if (criteria.destination) {
                const searchTerm = criteria.destination.toLowerCase();
                filteredSpaces = filteredSpaces.filter(space =>
                    (space.location?.toLowerCase().includes(searchTerm) ||
                    space.title?.toLowerCase().includes(searchTerm))
                );
                // console.log(`Filtered by destination "${criteria.destination}": ${filteredSpaces.length} spaces`);
            }

            if (criteria.type) {
                filteredSpaces = filteredSpaces.filter(space =>
                    space.unit_type === criteria.type
                );
                // console.log(`Filtered by type "${criteria.type}": ${filteredSpaces.length} spaces`);
            }

            // console.log('Final results:', filteredSpaces.map(s => ({ id: s.id, title: s.title, hasImage: !!s.images })));
            setResults(filteredSpaces);

        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const getSpaceTypeLabel = (type) => {
        const types = {
            'open_desk': 'Open Desk',
            'dedicated_desk': 'Dedicated Desk',
            'private_cabin': 'Private Cabin',
            'meeting_room': 'Meeting Room'
        };
        return types[type] || type?.replace('_', ' ') || 'Space';
    };

    const getSpaceTypeIcon = (type) => {
        const icons = {
            'open_desk': '🖥️',
            'dedicated_desk': '💺',
            'private_cabin': '🚪',
            'meeting_room': '👥'
        };
        return icons[type] || '🏢';
    };

    const handleSpaceClick = (spaceId, unitType) => {
        let path = '';
        switch (unitType) {
            case 'open_desk':
                path = `/spaces/${spaceId}`;
                break;
            case 'dedicated_desk':
                path = `/dedicated-desk/${spaceId}`;
                break;
            case 'private_cabin':
                path = `/private-cabins/${spaceId}`;
                break;
            case 'meeting_room':
                path = `/meeting-rooms/${spaceId}`;
                break;
            default:
                path = `/spaces/${spaceId}`;
        }
        navigate(path);
    };

    return (
        <div className="search-results-container">
            <div className="search-results-header">
                <h1>Search Results</h1>
                <div className="search-filters-summary">
                    {searchParams.destination && (
                        <span className="filter-badge">
                            📍 {searchParams.destination}
                        </span>
                    )}
                    {searchParams.type && (
                        <span className="filter-badge">
                            🏢 {getSpaceTypeLabel(searchParams.type)}
                        </span>
                    )}
                    {searchParams.startTime && searchParams.endTime && (
                        <span className="filter-badge">
                            ⏰ {searchParams.startTime} - {searchParams.endTime}
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner">Searching for spaces...</div>
            ) : results.length > 0 ? (
                <>
                    <p className="result-count">Found {results.length} space{results.length !== 1 ? 's' : ''}</p>
                    <div className="results-grid">
                        {results.map(space => (
                            <div
                                key={space.id}
                                className="space-card"
                                onClick={() => handleSpaceClick(space.id, space.unit_type)}
                            >
                                <div className="space-image">
                                    {space.images ? (
                                        <img 
                                            src={space.images} 
                                            alt={space.title}
                                            onError={(e) => {
                                                // console.log(`Image failed to load for ${space.title}:`, space.images);
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = `<div class="image-placeholder">${getSpaceTypeIcon(space.unit_type)}</div>`;
                                            }}
                                        />
                                    ) : (
                                        <div className="image-placeholder">{getSpaceTypeIcon(space.unit_type)}</div>
                                    )}
                                    <div className="space-type-badge">{getSpaceTypeLabel(space.unit_type)}</div>
                                </div>
                                <div className="space-info">
                                    <h3>{space.title}</h3>
                                    <p className="space-location">📍 {space.location}</p>
                                    <div className="space-details-row">
                                        <span className="space-rating">⭐ {space.rating}</span>
                                        <span className="space-capacity">👥 Up to {space.capacity}</span>
                                    </div>
                                    <div className="space-price-section">
                                        <p className="space-price">{space.priceDisplay}</p>
                                        <button className="view-details-btn">View Details →</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="no-results">
                    <p>No spaces found matching your criteria.</p>
                    <button onClick={() => navigate('/')}>Try different search</button>
                </div>
            )}
        </div>
    );
};

export default SearchResults;