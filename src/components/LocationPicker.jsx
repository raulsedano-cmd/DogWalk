import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { getImageUrl } from '../services/api';

const libraries = ['places'];
const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '12px',
};

const defaultCenter = {
    lat: -12.0464, // Lima, Peru
    lng: -77.0428,
};

const MapContent = ({ label, lat, lng, onChange, onAddressChange }) => {
    const [marker, setMarker] = useState(null);
    const mapRef = useRef(null);

    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            location: { lat: () => defaultCenter.lat, lng: () => defaultCenter.lng },
            radius: 200 * 1000,
            componentRestrictions: { country: 'pe' },
        },
        debounce: 300,
    });

    useEffect(() => {
        if (lat && lng) {
            const newPos = { lat: parseFloat(lat), lng: parseFloat(lng) };
            setMarker(newPos);
            // On initial load, if search field is empty, reverse geocode the coords
            if (!value) {
                getGeocode({ location: newPos })
                    .then(results => {
                        if (results[0]) {
                            setValue(results[0].formatted_address, false);
                        }
                    })
                    .catch(err => console.error("Initial reverse geocode failed", err));
            }
        }
    }, [lat, lng, setValue]); // Note: skipped 'value' to avoid unnecessary re-triggers

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    // Helper function to extract address components correctly
    const extractAddressComponents = (components) => {
        const getComponent = (types) => {
            const comp = components.find(c => types.some(t => c.types.includes(t)));
            return comp ? comp.long_name : '';
        };

        // Specific logic for Peru/Lima
        // District is usually 'locality' or 'sublocality_level_1'
        // City/Province is 'administrative_area_level_2' (e.g., Lima Province)
        // Region/Department is 'administrative_area_level_1' (e.g., Lima Region)

        // Priority for District: Locality -> Sublocality Level 1 -> Neighborhood
        let zone = getComponent(['locality']);
        if (!zone || zone === 'Lima') { // If locality is 'Lima', look deeper for district
            zone = getComponent(['sublocality_level_1', 'sublocality']);
        }

        // Priority for City: Admin Level 2 (Province) -> Admin Level 1 (Region)
        let city = getComponent(['administrative_area_level_2']);
        if (!city) {
            city = getComponent(['administrative_area_level_1']);
        }

        // Fallback: If both are the same, try to differentiate
        if (city === zone) {
            const altZone = getComponent(['sublocality_level_1', 'neighborhood']);
            if (altZone) zone = altZone;
        }

        const country = getComponent(['country']);

        return { city, zone, country };
    };

    const handleMapClick = useCallback(async (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setMarker({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);

        // Reverse geocode to get address details
        try {
            const results = await getGeocode({ location: { lat: newLat, lng: newLng } });
            if (results && results[0]) {
                const address = results[0];

                // Update the search input value with the clicked address
                setValue(address.formatted_address, false);

                const { city, zone, country } = extractAddressComponents(address.address_components);

                if (onAddressChange) {
                    onAddressChange(city, zone, country, address.formatted_address);
                }
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }
    }, [onChange, onAddressChange, setValue]);

    const handleSelect = async (address) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);

            const newPos = { lat, lng };
            setMarker(newPos);
            onChange(lat, lng);

            if (mapRef.current) {
                mapRef.current.panTo(newPos);
                mapRef.current.setZoom(17);
            }

            const { city, zone, country } = extractAddressComponents(results[0].address_components);

            if (onAddressChange) {
                onAddressChange(city, zone, country, results[0].formatted_address);
            }
        } catch (error) {
            console.error('Error selecting place:', error);
            // Fallback for when geocoding fails but we have coords from click
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">{label}</label>

            <div className="relative">
                <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                        <input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            disabled={!ready}
                            placeholder="Busca tu dirección exacta..."
                            className="input-field pr-10"
                        />
                        {value && (
                            <button
                                onClick={() => { setValue(''); clearSuggestions(); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {status === 'OK' && (
                    <div className="absolute z-[100] w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 overflow-hidden">
                        {data.map(({ place_id, description }) => (
                            <div
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="px-4 py-3 hover:bg-primary-50 cursor-pointer text-sm border-b last:border-0 transition-colors"
                            >
                                <span className="font-medium text-gray-800">{description}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={lat && lng ? 17 : 13}
                    center={marker || defaultCenter}
                    onClick={handleMapClick}
                    onLoad={onMapLoad}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        zoomControl: true,
                    }}
                >
                    {marker && <Marker position={marker} animation={window.google?.maps?.Animation?.DROP} />}
                </GoogleMap>
            </div>
        </div>
    );
};

const LocationPicker = (props) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey || '',
        libraries,
    });

    if (loadError) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error cargando Google Maps. Verifica tu API Key.</div>;
    if (!isLoaded) return <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Cargando Google Maps...</div>;

    return (
        <>
            <MapContent {...props} />
            {!apiKey && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-2 text-xs text-yellow-700">
                    ⚠️ <strong>API Key Pendiente:</strong> Para que el mapa funcione correctamente, debes agregar <code>VITE_GOOGLE_MAPS_API_KEY</code> en tu archivo <code>.env</code>.
                </div>
            )}
        </>
    );
};

export default LocationPicker;
