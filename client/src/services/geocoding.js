// Geocoding service using OpenStreetMap Nominatim API
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export const geocodingService = {
    // Search for locations based on query
    async searchLocation(query) {
        try {
            const response = await fetch(
                `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1&countrycodes=pe`,
                {
                    headers: {
                        'Accept-Language': 'es'
                    }
                }
            );
            const data = await response.json();
            return data.map(item => ({
                displayName: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                city: item.address?.city || item.address?.town || item.address?.village || '',
                zone: item.address?.suburb || item.address?.neighbourhood || item.address?.quarter || '',
                street: item.address?.road || '',
                houseNumber: item.address?.house_number || '',
                fullAddress: [
                    item.address?.road,
                    item.address?.house_number,
                    item.address?.suburb || item.address?.neighbourhood,
                    item.address?.city || item.address?.town
                ].filter(Boolean).join(', ')
            }));
        } catch (error) {
            console.error('Geocoding error:', error);
            return [];
        }
    },

    // Reverse geocode: get address from coordinates
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'es'
                    }
                }
            );
            const data = await response.json();
            return {
                displayName: data.display_name,
                city: data.address?.city || data.address?.town || data.address?.village || '',
                zone: data.address?.suburb || data.address?.neighbourhood || data.address?.quarter || '',
                address: data.address
            };
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    },

    // Get user's current location with high accuracy
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation no está soportada por este navegador'));
                return;
            }

            const options = {
                enableHighAccuracy: true,  // Use GPS if available
                timeout: 10000,            // Wait up to 10 seconds
                maximumAge: 0              // Don't use cached position
            };

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const address = await this.reverseGeocode(latitude, longitude);
                    resolve({
                        lat: latitude,
                        lng: longitude,
                        accuracy: accuracy, // in meters
                        ...address
                    });
                },
                (error) => {
                    let errorMessage = 'Error al obtener ubicación';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Permiso de ubicación denegado. Por favor, habilita el acceso a tu ubicación en la configuración del navegador.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Información de ubicación no disponible.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Tiempo de espera agotado al obtener ubicación.';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    }
};
