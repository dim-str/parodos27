// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.75rem' // Ταιριάζει με τα rounded-xl του UI σου
};

// Προεπιλεγμένο κέντρο (Θεσσαλονίκη)
const defaultCenter = {
    lat: 40.6401,
    lng: 22.9444
};

// Αυτά τα libraries χρειάζονται για την αναζήτηση διευθύνσεων
const libraries = ['places'];

export default function DeliveryMap({ onLocationSelect }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    const [map, setMap] = useState(null);
    const [markerPos, setMarkerPos] = useState(defaultCenter);

    const onLoad = useCallback(function callback(mapInstance) {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    // Τι γίνεται όταν ο πελάτης κάνει κλικ/σύρει την πινέζα στον χάρτη
    const handleMapClick = (event) => {
        const newPos = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        setMarkerPos(newPos);

        // Στέλνουμε τις συντεταγμένες πίσω στο Checkout
        if (onLocationSelect) {
            onLocationSelect(newPos);
        }
    };

    if (!isLoaded) return <div className="h-[300px] w-full bg-olive-100 animate-pulse rounded-xl flex items-center justify-center text-olive-500 font-bold">Φόρτωση Χάρτη...</div>;

    return (
        <div className="border-2 border-olive-200 rounded-xl overflow-hidden shadow-sm">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={markerPos}
                zoom={15}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={{
                    disableDefaultUI: true, // Κρύβει τα περιττά κουμπιά της Google
                    zoomControl: true,
                }}
            >
                <Marker
                    position={markerPos}
                    draggable={true}
                    onDragEnd={handleMapClick}
                />
            </GoogleMap>
            <div className="bg-olive-50 p-2 text-xs text-center text-olive-600 font-bold border-t border-olive-200">
                Μπορείτε να σύρετε την πινέζα για μεγαλύτερη ακρίβεια
            </div>
        </div>
    );
}