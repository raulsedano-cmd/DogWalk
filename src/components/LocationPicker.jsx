import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { uberMapStyle } from '../helpers/mapStyles';
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

// Trusted mapping of Postal Codes to Districts for Lima
// Google Maps often return generic 'Lima' for locality but correct Postal Code.
const POSTAL_CODE_DISTRICTS = {
    '15012': 'La Molina',
    '15023': 'Santiago de Surco',
    '15026': 'Santiago de Surco',
    '15033': 'Santiago de Surco',
    '15038': 'San Borja',
    '15037': 'San Borja',
    '15036': 'San Isidro',
    '15074': 'Miraflores',
    '15063': 'Barranco',
    '15086': 'Magdalena del Mar',
    '15084': 'San Miguel',
    '15046': 'Santiago de Surco',
    '15047': 'Santiago de Surco',
    '15048': 'Santiago de Surco',
    '15049': 'Santiago de Surco',
    '15088': 'San Miguel',
    '15081': 'San Miguel',
    '15076': 'Miraflores',
    '15039': 'Surquillo',
    '15034': 'Surquillo',
    '15011': 'Ate',
    '15001': 'Cercado de Lima',
    '15046': 'Santiago de Surco'
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
    // Helper function to extract address components correctly
    // Accepts either a full results array (preferred) or a single components array
    // Accepts either a full results array (preferred) or a single components array
    const extractAddressComponents = (input) => {
        // --- DEBUG START ---
        console.log('--- DEBUG GOOGLE MAPS RESULTS ---');
        console.log('Input:', input);
        // --- DEBUG END ---

        // Normalization: Ensure we have access to a list of components from the most specific result
        // and ideally the full list of results to scan for administrative levels
        let components;
        let fullResults = [];

        if (Array.isArray(input) && input[0]?.address_components) {
            // It's a full GeocoderResult[]
            fullResults = input;
            components = input[0].address_components;
        } else if (Array.isArray(input)) {
            // It's just address_components[]
            components = input;
        } else {
            return { city: '', zone: '', country: '' };
        }

        const getComponent = (list, types) => {
            const comp = list.find(c => types.some(t => c.types.includes(t)));
            return comp ? comp.long_name : '';
        };

        // --- ZONE / DISTRITO STRATEGY ---
        let zone = '';

        // 1. High Precision: Look for a result node that represents the District itself
        // In Peru, this is typically 'administrative_area_level_3'
        if (fullResults.length > 0) {
            console.log('Looking for Admin Level 3 in full results...');
            const districtNode = fullResults.find(r => r.types.includes('administrative_area_level_3'));
            if (districtNode) {
                console.log('FOUND Admin Level 3 Node:', districtNode);
                // The first component of this result node is typically the district name
                zone = districtNode.address_components[0]?.long_name;
            } else {
                console.log('Admin Level 3 NOT FOUND in results list.');
            }
        }

        // 2. Fallback: Parse components of the specific address
        if (!zone) {
            console.log('Fallback: Looking in specific address components');
            // CRITICAL DEBUG: Print full object to see hidden fields
            console.log('Specific Address Components JSON:', JSON.stringify(components, null, 2));

            zone = getComponent(components, ['administrative_area_level_3']);
        }

        if (!zone) {
            console.log('Fallback 2: Looking for locality (Priority over Sublocality)');
            const val = getComponent(components, ['locality']);
            // Ignore generic city names if they appear as locality
            if (val && !['Lima', 'Callao', 'Trujillo', 'Arequipa'].includes(val)) {
                zone = val;
            }
        }

        if (!zone) {
            console.log('Fallback 3: Looking for sublocality_level_1 (Urbanization)');
            zone = getComponent(components, ['sublocality_level_1']);
        }

        // --- EMERGENCY FALLBACK: PARSE FORMATTED ADDRESS ---
        // If we still suspect zone is wrong (formatted address usually has "District, City")
        // Format matches: "Street, Urbanization, District, City, Country"
        if (input[0]?.formatted_address) {
            const addressParts = input[0].formatted_address.split(',').map(p => p.trim());
            console.log('Address Parts:', addressParts);

            // Heuristic: If we found "Las Acacias" (sublocality) but the address has more parts,
            // maybe the district is the part AFTER sublocality or BEFORE City.

            // Find explicit 'Lima' or 'Callao' index
            const cityIndex = addressParts.findIndex(p => p.includes('Lima') || p.includes('Callao'));

            if (cityIndex > 0) {
                // The part potentially immediately before City is the District
                const potentialDistrict = addressParts[cityIndex - 1];

                // If our current zome matches a part that is NOT the potential district, 
                // and potential district looks like a valid name (no numbers), swap it.
                if (potentialDistrict && potentialDistrict !== zone && !/\d/.test(potentialDistrict)) {
                    console.log(`Swapping Zone '${zone}' for Potential District from String: '${potentialDistrict}'`);
                    zone = potentialDistrict;
                }
            }
        }

        // --- ULTRA FALLBACK: POSTAL CODE LOOKUP ---
        // If we have a postal code, it is the ultimate source of truth for the District.
        const postalCode = getComponent(components, ['postal_code']);
        if (postalCode && POSTAL_CODE_DISTRICTS[postalCode]) {
            console.log(`Postal Code ${postalCode} mapped to Trusted District: ${POSTAL_CODE_DISTRICTS[postalCode]}`);
            zone = POSTAL_CODE_DISTRICTS[postalCode];
        }

        console.log('FINAL ZONE EXTRACTED:', zone);




        // --- CITY / CIUDAD ---
        let city = getComponent(components, ['administrative_area_level_2']); // Province
        if (!city) {
            city = getComponent(components, ['administrative_area_level_1']); // Region
        }

        const country = getComponent(components, ['country']);

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

                const { city, zone, country } = extractAddressComponents(results);

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

            const { city, zone, country } = extractAddressComponents(results);

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
                        disableDefaultUI: true,
                        zoomControl: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        styles: uberMapStyle,
                    }}
                >
                    {marker && (
                        <Marker
                            position={marker}
                            animation={window.google?.maps?.Animation?.DROP}
                            icon={{
                                url: "https://cdn-icons-png.flaticon.com/512/1239/1239525.png", // House pin icon
                                scaledSize: { width: 40, height: 40 },
                                anchor: { x: 20, y: 20 }
                            }}
                        />
                    )}
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
