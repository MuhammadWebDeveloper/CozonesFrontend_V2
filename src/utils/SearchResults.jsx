// components/search/SearchResults.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BaseUrl from '../utils/AppConstants.jsx';
import "../componentstyles/utilstyle/searchResults.css";
import { 
    MapPin, 
    Building2, 
    Clock, 
    Star, 
    Users, 
    CheckCircle, 
    AlertCircle,
    Loader2,
    RefreshCw,
    Search,
    ChevronRight,
    Computer,
    Armchair,
    DoorClosed,
    Users as UsersIcon,
    Home
} from 'lucide-react';

const SearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchCriteria = {
            destination: params.get('destination') || '',
            type: params.get('type') || '',
            startTime: params.get('startTime') || '',
            endTime: params.get('endTime') || ''
        };
        setSearchParams(searchCriteria);
        
        // Only search if there are criteria
        if (searchCriteria.destination || searchCriteria.type) {
            performSearch(searchCriteria);
        } else {
            setLoading(false);
            setResults([]);
        }
    }, [location.search]);

    const performSearch = async (criteria) => {
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const apiClient = axios.create({
                baseURL: BaseUrl,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                timeout: 30000
            });

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (criteria.destination) queryParams.append('destination', criteria.destination);
            if (criteria.type) queryParams.append('type', criteria.type);
            
            const url = `api/spaces/search?${queryParams.toString()}`;
            // console.log('🔍 Searching:', url);
            
            const response = await apiClient.get(url);
            
            // console.log('📡 Search response:', response.data);
            
            if (response.data?.success) {
                const units = response.data.units || [];
                
                // Transform the data for display
                const transformedResults = units.map(unit => {
                    // Handle images
                    let imageUrl = null;
                    if (unit.images && Array.isArray(unit.images) && unit.images.length > 0) {
                        const firstImage = unit.images[0];
                        if (typeof firstImage === 'string') {
                            imageUrl = firstImage;
                        } else if (firstImage?.image_base64) {
                            imageUrl = firstImage.image_base64;
                        } else if (firstImage?.url) {
                            imageUrl = firstImage.url;
                        }
                    }
                    
                    // Get best rate for display
                    let priceDisplay = 'Contact for pricing';
                    let price = null;
                    
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
                    
                    return {
                        id: unit.id,
                        space_id: unit.space_id,
                        title: unit.name || unit.space_name || getSpaceTypeLabel(unit.unit_type),
                        location: unit.city || unit.address || 'Location available',
                        price: price,
                        priceDisplay: priceDisplay,
                        unit_type: unit.unit_type,
                        images: imageUrl,
                        capacity: unit.total_capacity || 1,
                        // rating: 4.5,
                        space_name: unit.space_name,
                        is_verified: unit.is_verified
                    };
                });
                
                console.log(`✅ Found ${transformedResults.length} results`);
                setResults(transformedResults);
            } else {
                console.warn('⚠️ No results from API');
                setResults([]);
                if (!response.data?.success) {
                    setError(response.data?.message || 'No results found');
                }
            }
            
        } catch (error) {
            console.error('❌ Search error:', error);
            setError(error.response?.data?.message || error.message || 'Search failed. Please try again.');
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
            'open_desk': Computer,
            'dedicated_desk': Armchair,
            'private_cabin': DoorClosed,
            'meeting_room': UsersIcon
        };
        return icons[type] || Building2;
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

    const getLocationDisplay = () => {
        if (searchParams.destination) return searchParams.destination;
        if (results.length > 0 && results[0].location) return results[0].location;
        return 'All locations';
    };

    if (loading) {
        return (
            <div className="search-results-container">
                <div className="loading-state">
                    <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Searching for spaces...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="search-results-container">
                <div className="error-state">
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={20} /> {error}
                    </p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        <RefreshCw size={16} style={{ marginRight: '6px' }} />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="search-results-container">
            <div className="search-results-header">
                <h1>
                    <Search size={24} style={{ marginRight: '10px', display: 'inline' }} />
                    Search Results
                </h1>
                <div className="search-filters-summary">
                    {searchParams.destination && (
                        <span className="filter-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} /> {searchParams.destination}
                        </span>
                    )}
                    {searchParams.type && (
                        <span className="filter-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={14} /> {getSpaceTypeLabel(searchParams.type)}
                        </span>
                    )}
                    {searchParams.startTime && searchParams.endTime && (
                        <span className="filter-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} /> {searchParams.startTime} - {searchParams.endTime}
                        </span>
                    )}
                </div>
            </div>

            {results.length > 0 ? (
                <>
                    <p className="result-count">
                        Found {results.length} space{results.length !== 1 ? 's' : ''} in {getLocationDisplay()}
                    </p>
                    <div className="results-grid">
                        {results.map(space => {
                            const IconComponent = getSpaceTypeIcon(space.unit_type);
                            return (
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
                                                    console.log(`Image failed to load for ${space.title}`);
                                                    e.target.style.display = 'none';
                                                    if (e.target.parentElement) {
                                                        e.target.parentElement.innerHTML = `<div class="image-placeholder">${getSpaceTypeIcon(space.unit_type)}</div>`;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="image-placeholder">
                                                <IconComponent size={48} />
                                            </div>
                                        )}
                                        <div className="space-type-badge">{getSpaceTypeLabel(space.unit_type)}</div>
                                        {space.is_verified && (
                                            <div className="verified-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <CheckCircle size={14} /> Verified
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-info">
                                        <h3>{space.title}</h3>
                                        {space.space_name && space.space_name !== space.title && (
                                            <p className="space-venue" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={14} /> {space.space_name}
                                            </p>
                                        )}
                                        <p className="space-location" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={14} /> {space.location}
                                        </p>
                                        <div className="space-details-row">
                                            <span className="space-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Star size={14} /> {space.rating}
                                            </span>
                                            <span className="space-capacity" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Users size={14} /> Up to {space.capacity}
                                            </span>
                                        </div>
                                        <div className="space-price-section">
                                            <p className="space-price">{space.priceDisplay}</p>
                                            <button className="view-details-btn">
                                                View Details <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="no-results">
                    <p>No spaces found matching your criteria.</p>
                    <p className="no-results-hint">Try adjusting your search filters or location.</p>
                    <button onClick={() => navigate('/')} className="search-again-btn">
                        <Home size={16} style={{ marginRight: '6px' }} />
                        Search Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default SearchResults;