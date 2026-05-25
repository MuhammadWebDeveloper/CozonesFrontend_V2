// SpaceLocationMap.jsx
import React, { useEffect, useRef } from 'react';

function SpaceLocationMap({ latitude, longitude, address, name }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!latitude || !longitude) return;

        // Load Google Maps
        const loadMap = () => {
            const location = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                center: location,
                zoom: 15,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            markerRef.current = new window.google.maps.Marker({
                map: mapInstanceRef.current,
                position: location,
                title: name
            });

            // Add info window
            const infoWindow = new window.google.maps.InfoWindow({
                content: `<div style="padding: 8px;"><strong>${name}</strong><br/>${address || ''}</div>`
            });

            markerRef.current.addListener('click', () => {
                infoWindow.open(mapInstanceRef.current, markerRef.current);
            });
        };

        if (window.google) {
            loadMap();
        } else {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY`;
            script.onload = loadMap;
            document.head.appendChild(script);
        }
    }, [latitude, longitude, name, address]);

    if (!latitude || !longitude) {
        return <div className="SpaceLocationMap_placeholder">Location not available</div>;
    }

    return (
        <div className="SpaceLocationMap_container">
            <div ref={mapRef} className="SpaceLocationMap_map"></div>
            {address && (
                <div className="SpaceLocationMap_address">
                    📍 {address}
                </div>
            )}
        </div>
    );
}

export default SpaceLocationMap;