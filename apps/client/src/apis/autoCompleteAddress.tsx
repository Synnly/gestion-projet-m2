import throttle from 'lodash/throttle';

interface GeoapifyResponse {
    type: 'FeatureCollection';
    features: GeoapifyFeature[];
    query: {
        text: string;
        parsed: {
            city?: string;
            street?: string;
            housenumber?: string;
            postcode?: string;
            country?: string;
        };
    };
}

export interface GeoapifyFeature {
    type: 'Feature';
    properties: {
        country: string;
        country_code: string;
        city: string;
        postcode: string;
        district?: string;
        suburb?: string;
        street?: string;
        housenumber?: string;
        lon: number;
        lat: number;
        formatted: string; // L'adresse complète déjà construite
        address_line1: string; // Rue + numéro
        address_line2: string; // Code postal + Ville + Pays
        category: string;
        result_type: 'amenity' | 'building' | 'street' | 'city' | 'postcode';
        place_id: string;
    };
    geometry: {
        type: 'Point';
        coordinates: [number, number]; // [Longitude, Latitude]
    };
}
export const getAddressLabel = (item: GeoapifyFeature): string => {
    const p = item.properties;
    return p.formatted || `${p.address_line1}, ${p.address_line2}`.trim() || p.city || p.country;
};
const throttledFetch = throttle(
    async (query: string): Promise<GeoapifyFeature[]> => {
        if (!query || query.length < 5) return [];

        const apiKey = import.meta.env.VITE_GEOAPIFY_KEY;
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&lang=fr&apiKey=${apiKey}&limit=10`;
        try {
            const response = await fetch(url);

            if (!response.ok) return [];

            const data: GeoapifyResponse = await response.json();
            return data.features.filter((item) => item.properties.formatted);
        } catch (error) {
            console.error('Erreur Autocomplete:', error);
            return [];
        }
    },
    3000, // 1 seconde de throttle
    { leading: true, trailing: true },
);

export const addressFetcher = async (query: string) => {
    const result = await throttledFetch(query);
    return result ?? [];
};
