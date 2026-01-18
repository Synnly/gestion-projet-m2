import throttle from 'lodash/throttle';
export interface NominatimAddress {
    place_id: number;
    display_name: string;
    address: {
        house_number?: string;
        road?: string;
        city?: string;
        town?: string;
        village?: string;
        postcode?: string;
        country?: string;
        country_code?: string;
    };
    lat: string;
    lon: string;
}
export const getAddressLabel = (item: NominatimAddress): string => {
    const a = item.address;

    const street = a.house_number ? `${a.house_number} ${a.road || ''}` : a.road || '';

    const city = a.city || a.town || a.village || '';

    return [street, `${a.postcode || ''} ${city}`.trim(), a.country].filter(Boolean).join(', ');
};
const throttledFetch = throttle(
    async (query: string): Promise<NominatimAddress[]> => {
        if (!query || query.length < 5) return [];

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query,
        )}&format=json&addressdetails=1&limit=5`;

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'MonAppReact/1.0 (contact@votre-email.com)',
                },
            });

            if (!response.ok) return [];

            const data: NominatimAddress[] = await response.json();

            return data.filter((item) => item.address.road || item.address.city || item.address.town);
        } catch (error) {
            console.error('Erreur Autocomplete:', error);
            return [];
        }
    },
    1000, // 1 seconde de throttle
    { leading: true, trailing: true },
);

export const addressFetcher = async (query: string) => {
    const result = await throttledFetch(query);
    return result ?? [];
};
