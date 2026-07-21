import React, { useState, useRef, useEffect } from 'react';
import './../../componentstyles/sellerdashboardstyles/createspace.css';
import BaseUrl from '../../utils/AppConstants';
import {
    Wifi,
    Snowflake,
    Coffee,
    Printer,
    ParkingSquare,
    ShieldCheck,
    Zap,
    ArrowRight,
} from 'lucide-react';

// Load Google Maps API
const loadGoogleMapsScript = (callback) => {
    // Already fully loaded — safe to use immediately
    if (window.google && window.google.maps) {
        if (callback) callback();
        return;
    }

    const existingScript = document.getElementById('googleMapsScript');

    if (existingScript) {
        // Script tag exists but may still be loading — wait for it
        existingScript.addEventListener('load', () => {
            if (callback) callback();
        });
        return;
    }

    const script = document.createElement('script');
    // ⚠️ REPLACE WITH YOUR ACTUAL API KEY
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
    script.id = 'googleMapsScript';
    script.onload = () => {
        if (callback) callback();
    };
    document.body.appendChild(script);
};

function CreateSpace() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        area: '',
        google_maps_link: '',
        latitude: '',
        longitude: '',
        opening_time: '',
        closing_time: '',
        working_days: [],
        has_wifi: false,
        has_ac: false,
        has_coffee: false,
        has_printer: false,
        has_parking: false,
        has_security: false,
        has_backup_power: false,
        cancellation_policy: '',
        refund_policy: '',
        late_arrival_policy: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [mapLoaded, setMapLoaded] = useState(false);

    const mapRef = useRef(null);
    const searchBoxRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    const workingDaysOptions = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    useEffect(() => {
        loadGoogleMapsScript(() => {
            setMapLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (mapLoaded && mapRef.current && !mapInstanceRef.current) {
            initMap();
        }
    }, [mapLoaded]);

    const initMap = () => {
        if (!window.google || !window.google.maps) {
            console.error('Google Maps script not loaded yet.');
            return;
        }

        const defaultLocation = { lat: 40.7128, lng: -74.0060 };

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: defaultLocation,
            zoom: 13,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        const input = searchBoxRef.current;
        const searchBox = new window.google.maps.places.SearchBox(input);

        mapInstanceRef.current.controls[window.google.maps.ControlPosition.TOP_LEFT].push(input);

        mapInstanceRef.current.addListener('bounds_changed', () => {
            searchBox.setBounds(mapInstanceRef.current.getBounds());
        });

        searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;

            const place = places[0];
            if (!place.geometry || !place.geometry.location) return;

            mapInstanceRef.current.setCenter(place.geometry.location);
            mapInstanceRef.current.setZoom(15);

            if (markerRef.current) {
                markerRef.current.setMap(null);
            }

            markerRef.current = new window.google.maps.Marker({
                map: mapInstanceRef.current,
                position: place.geometry.location,
                draggable: true
            });

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const formattedAddress = place.formatted_address || '';

            setFormData(prev => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lng.toString(),
                address: formattedAddress,
                google_maps_link: `https://maps.google.com/?q=${lat},${lng}`
            }));

            const cityComponent = place.address_components?.find(comp =>
                comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
            );
            if (cityComponent) {
                setFormData(prev => ({ ...prev, city: cityComponent.long_name }));
            }

            const areaComponent = place.address_components?.find(comp =>
                comp.types.includes('sublocality') || comp.types.includes('neighborhood')
            );
            if (areaComponent) {
                setFormData(prev => ({ ...prev, area: areaComponent.long_name }));
            }

            markerRef.current.addListener('dragend', () => {
                const position = markerRef.current.getPosition();
                const newLat = position.lat();
                const newLng = position.lng();

                setFormData(prev => ({
                    ...prev,
                    latitude: newLat.toString(),
                    longitude: newLng.toString(),
                    google_maps_link: `https://maps.google.com/?q=${newLat},${newLng}`
                }));

                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        setFormData(prev => ({ ...prev, address: results[0].formatted_address }));
                    }
                });
            });
        });

        mapInstanceRef.current.addListener('click', (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();

            if (markerRef.current) {
                markerRef.current.setMap(null);
            }

            markerRef.current = new window.google.maps.Marker({
                map: mapInstanceRef.current,
                position: { lat, lng },
                draggable: true
            });

            setFormData(prev => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lng.toString(),
                google_maps_link: `https://maps.google.com/?q=${lat},${lng}`
            }));

            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    setFormData(prev => ({ ...prev, address: results[0].formatted_address }));
                }
            });

            markerRef.current.addListener('dragend', () => {
                const position = markerRef.current.getPosition();
                const newLat = position.lat();
                const newLng = position.lng();

                setFormData(prev => ({
                    ...prev,
                    latitude: newLat.toString(),
                    longitude: newLng.toString(),
                    google_maps_link: `https://maps.google.com/?q=${newLat},${newLng}`
                }));

                geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        setFormData(prev => ({ ...prev, address: results[0].formatted_address }));
                    }
                });
            });
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleWorkingDaysChange = (day) => {
        setFormData(prev => ({
            ...prev,
            working_days: prev.working_days.includes(day)
                ? prev.working_days.filter(d => d !== day)
                : [...prev.working_days, day]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (!formData.name || !formData.city) {
            setMessage({ type: 'error', text: 'Space name and city are required!' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // ✅ CORRECT ENDPOINT
            const response = await fetch(  `${BaseUrl}api/spaces/creation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Space created successfully!' });
                setTimeout(() => {
                    window.location.href = '/seller-dashboard';
                }, 2000);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            console.error('Submit error:', error);
            setMessage({ type: 'error', text: 'Server error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="CreateSpace_container">
            <div className="CreateSpace_header">
                <h1 className="CreateSpace_title">Create New Workspace</h1>
                <p className="CreateSpace_subtitle">Fill in the details to add a new space to your portfolio</p>
            </div>

            {message.text && (
                <div className={`CreateSpace_message CreateSpace_message_${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="CreateSpace_form">
                {/* Basic Information Section */}
                <div className="CreateSpace_section">
                    <h2 className="CreateSpace_sectionTitle">Basic Information</h2>
                    <div className="CreateSpace_grid">
                        <div className="CreateSpace_field">
                            <label className="CreateSpace_label">Space Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="CreateSpace_input"
                                placeholder="e.g., Co-working Hub Downtown"
                                required
                            />
                        </div>

                        <div className="CreateSpace_field">
                            <label className="CreateSpace_label">City *</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className="CreateSpace_input"
                                placeholder="e.g., New York"
                                required
                            />
                        </div>

                        <div className="CreateSpace_field CreateSpace_field_full">
                            <label className="CreateSpace_label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="CreateSpace_textarea"
                                placeholder="Describe your workspace..."
                                rows="4"
                            />
                        </div>
                    </div>
                </div>

                {/* Location Section with Map */}
                <div className="CreateSpace_section">
                    <h2 className="CreateSpace_sectionTitle">Location Details</h2>

                    <div className="CreateSpace_mapSearch">
                        <input
                            ref={searchBoxRef}
                            type="text"
                            placeholder="Search for a location..."
                            className="CreateSpace_searchInput"
                        />
                    </div>

                    <div className="CreateSpace_mapContainer">
                        <div ref={mapRef} className="CreateSpace_map"></div>
                    </div>

                    <div className="CreateSpace_grid" style={{ marginTop: '20px' }}>
                        <div className="CreateSpace_field CreateSpace_field_full">
                            <label className="CreateSpace_label">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="CreateSpace_input"
                                placeholder="Address will appear here after map selection"
                            />
                        </div>

                        <div className="CreateSpace_field">
                            <label className="CreateSpace_label">Area/Locality</label>
                            <input
                                type="text"
                                name="area"
                                value={formData.area}
                                onChange={handleInputChange}
                                className="CreateSpace_input"
                                placeholder="e.g., Downtown"
                            />
                        </div>

                        <div className="CreateSpace_field">
                            <label className="CreateSpace_label">Google Maps Link</label>
                            {formData.google_maps_link ? (
                                <a
                                    href={formData.google_maps_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="CreateSpace_mapLink"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                    View on Google Maps <ArrowRight size={14} />
                                </a>
                            ) : (
                                <input
                                    type="url"
                                    name="google_maps_link"
                                    value={formData.google_maps_link}
                                    onChange={handleInputChange}
                                    className="CreateSpace_input"
                                    placeholder="Will be auto-generated"
                                    readOnly
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Operating Hours Section */}
                <div className="CreateSpace_section">
                    <h2 className="CreateSpace_sectionTitle">Operating Hours</h2>
                    <div className="CreateSpace_grid">
                        <div className="CreateSpace_field">
                            <label className="CreateSpace_label">Opening Time</label>
                            <input
                                type="time"
                                name="opening_time"
                                value={formData.opening_time}
                                onChange={handleInputChange}
                                className="CreateSpace_input"
                            />
                        </div>

                        <div className="CreateSpace_field">
                            <label className="CreateSpace_label">Closing Time</label>
                            <input
                                type="time"
                                name="closing_time"
                                value={formData.closing_time}
                                onChange={handleInputChange}
                                className="CreateSpace_input"
                            />
                        </div>

                        <div className="CreateSpace_field CreateSpace_field_full">
                            <label className="CreateSpace_label">Working Days</label>
                            <div className="CreateSpace_checkboxGroup">
                                {workingDaysOptions.map(day => (
                                    <label key={day} className="CreateSpace_checkboxLabel">
                                        <input
                                            type="checkbox"
                                            checked={formData.working_days.includes(day)}
                                            onChange={() => handleWorkingDaysChange(day)}
                                            className="CreateSpace_checkbox"
                                        />
                                        <span>{day}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Amenities Section */}
                <div className="CreateSpace_section">
                    <h2 className="CreateSpace_sectionTitle">Amenities & Features</h2>
                    <div className="CreateSpace_amenitiesGrid">
                        <label className="CreateSpace_amenityLabel">
                            <input
                                type="checkbox"
                                name="has_wifi"
                                checked={formData.has_wifi}
                                onChange={handleInputChange}
                                className="CreateSpace_checkbox"
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Wifi size={16} /> Wi-Fi
                            </span>
                        </label>

                        <label className="CreateSpace_amenityLabel">
                            <input
                                type="checkbox"
                                name="has_ac"
                                checked={formData.has_ac}
                                onChange={handleInputChange}
                                className="CreateSpace_checkbox"
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Snowflake size={16} /> Air Conditioning
                            </span>
                        </label>

                        <label className="CreateSpace_amenityLabel">
                            <input
                                type="checkbox"
                                name="has_coffee"
                                checked={formData.has_coffee}
                                onChange={handleInputChange}
                                className="CreateSpace_checkbox"
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Coffee size={16} /> Coffee/Tea
                            </span>
                        </label>

                        <label className="CreateSpace_amenityLabel">
                            <input
                                type="checkbox"
                                name="has_printer"
                                checked={formData.has_printer}
                                onChange={handleInputChange}
                                className="CreateSpace_checkbox"
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Printer size={16} /> Printer/Scanner
                            </span>
                        </label>

                        <label className="CreateSpace_amenityLabel">
                            <input
                                type="checkbox"
                                name="has_parking"
                                checked={formData.has_parking}
                                onChange={handleInputChange}
                                className="CreateSpace_checkbox"
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <ParkingSquare size={16} /> Parking
                            </span>
                        </label>

                        <label className="CreateSpace_amenityLabel">
                            <input
                                type="checkbox"
                                name="has_security"
                                checked={formData.has_security}
                                onChange={handleInputChange}
                                className="CreateSpace_checkbox"
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={16} /> 24/7 Security
                            </span>
                        </label>

                        <label className="CreateSpace_amenityLabel">
                            <input
                                type="checkbox"
                                name="has_backup_power"
                                checked={formData.has_backup_power}
                                onChange={handleInputChange}
                                className="CreateSpace_checkbox"
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Zap size={16} /> Backup Power
                            </span>
                        </label>
                    </div>
                </div>

                {/* Policies Section */}
                <div className="CreateSpace_section">
                    <h2 className="CreateSpace_sectionTitle">Policies</h2>
                    <div className="CreateSpace_grid">
                        <div className="CreateSpace_field">
                            <label className="CreateSpace_label">Cancellation Policy</label>
                            <textarea
                                name="cancellation_policy"
                                value={formData.cancellation_policy}
                                onChange={handleInputChange}
                                className="CreateSpace_textarea"
                                placeholder="Describe your cancellation policy..."
                                rows="3"
                            />
                        </div>

                        <div className="CreateSpace_field">
                            <label className="CreateSpace_label">Refund Policy</label>
                            <textarea
                                name="refund_policy"
                                value={formData.refund_policy}
                                onChange={handleInputChange}
                                className="CreateSpace_textarea"
                                placeholder="Describe your refund policy..."
                                rows="3"
                            />
                        </div>

                        <div className="CreateSpace_field CreateSpace_field_full">
                            <label className="CreateSpace_label">Late Arrival Policy</label>
                            <textarea
                                name="late_arrival_policy"
                                value={formData.late_arrival_policy}
                                onChange={handleInputChange}
                                className="CreateSpace_textarea"
                                placeholder="Describe your late arrival policy..."
                                rows="3"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="CreateSpace_actions">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="CreateSpace_button CreateSpace_button_secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="CreateSpace_button CreateSpace_button_primary"
                    >
                        {loading ? 'Creating Space...' : 'Create Space'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateSpace;