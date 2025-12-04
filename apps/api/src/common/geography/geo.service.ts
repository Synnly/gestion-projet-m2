import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeoService {
    async geocodeAddress(address: string): Promise<[number, number] | null> {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'NestJS-Geocoder-App' },
            });

            if (!data || data.length === 0) return null;

            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            return [lon, lat]; // MongoDB format: [longitude, latitude]
        } catch (e) {
            console.error('Geocoding error:', e);
            return null;
        }
    }
}
