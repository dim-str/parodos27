'use client';

import { useState, useMemo } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '220px', borderRadius: '1.5rem' };
const defaultCenter = { lat: 37.9838, lng: 23.7275 }; // Αθήνα

export default function DeliveryAddressSearch({ onLocationSelect, initialAddress }) {
    // ΣΗΜΑΝΤΙΚΟ: Τα libraries πρέπει να είναι memoized ή έξω από το component
    const libraries = useMemo(() => ['places'], []);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    if (loadError) return <div className="p-4 text-red-500 bg-red-50 rounded-2xl">Σφάλμα φόρτωσης χάρτη</div>;
    if (!isLoaded) return <div className="animate-pulse bg-olive-50 h-52 rounded-3xl" />;

    return <AddressPicker onLocationSelect={onLocationSelect} initialAddress={initialAddress} />;
}

function AddressPicker({ onLocationSelect, initialAddress }) {
    const [selectedCoords, setSelectedCoords] = useState(null);

    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            componentRestrictions: { country: 'gr' }, // Περιορισμός στην Ελλάδα
            types: ['address'] // Μόνο διευθύνσεις (όχι ονόματα επιχειρήσεων)
        },
        debounce: 300,
        defaultValue: initialAddress
    });

    const handleSelect = async (address) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);

            const locationData = { address, lat, lng };
            setSelectedCoords({ lat, lng });
            onLocationSelect(locationData);
        } catch (error) {
            console.error("Σφάλμα κατά τον εντοπισμό:", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <label className="text-[10px] font-black uppercase text-olive-400 ml-2 mb-1 block tracking-widest">
                    Διεύθυνση Παράδοσης
                </label>
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={!ready}
                    className="w-full p-4 rounded-2xl border border-olive-100 bg-white outline-none focus:ring-2 focus:ring-orange-500 font-bold text-olive-900 shadow-sm"
                    placeholder="Ξεκινήστε να πληκτρολογείτε..."
                />

                {status === "OK" && (
                    <ul className="absolute z-[150] w-full bg-white border border-olive-100 mt-2 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="p-4 hover:bg-orange-50 cursor-pointer text-sm font-bold text-olive-900 border-b border-olive-50 last:border-0 transition-colors"
                            >
                                {description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="rounded-[2rem] overflow-hidden border-2 border-white shadow-lg h-[220px]">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={16}
                    center={selectedCoords || defaultCenter}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        styles: mapStyles // Προαιρετικό: μπορείς να προσθέσεις custom styles για πιο "olive" χάρτη
                    }}
                >
                    {selectedCoords && <MarkerF position={selectedCoords} />}
                </GoogleMap>
            </div>
        </div>
    );
}

// Προαιρετικό: Στυλ για να ταιριάζει ο χάρτης με το olive theme σου
const mapStyles = [
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }] },
    { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }, { "lightness": 20 }] }
];