import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * GeoService
 *
 * Lightweight wrapper around an HTTP geocoding provider (OpenStreetMap
 * Nominatim). Used to convert free-form postal addresses into a
 * GeoJSON-friendly coordinate pair ([longitude, latitude]).
 *
 * Notes about behaviour:
 * - Returns a tuple `[lon, lat]` on success or `null` on failure.
 * - Uses a short timeout and defensive error handling so failures do not
 *   block higher-level flows (e.g. post creation).
 * - Logs Axios errors for easier debugging in tests and CI.
 */
@Injectable()
export class GeoService {
    private readonly logger = new Logger(GeoService.name);

    private client = axios.create({
        baseURL: 'https://nominatim.openstreetmap.org',
        timeout: 3000, // 3s timeout
        headers: {
            'User-Agent': 'Stagora/1.0 (contact@stagora.com)',
            'Accept-Language': 'fr',
        },
        httpAgent: false,
        httpsAgent: false,
    });

    /**
     * Geocode an address string into a `[longitude, latitude]` tuple.
     *
     * @param address - Human readable address (street, city, country...)
     * @returns `[lon, lat]` on success or `null` when geocoding fails or
     *          no result is found. Failures are logged but do not throw.
     */
    async geocodeAddress(address: string): Promise<[number, number] | null> {
        try {
            const { data } = await this.client.get('/search', {
                params: {
                    format: 'json',
                    q: address,
                    addressdetails: 1,
                    limit: 1,
                },
            });

            if (!data || data.length === 0) return null;

            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            return [lon, lat];
        } catch (e) {
            if (axios.isAxiosError(e)) {
                this.logger.error('Geocoding Axios error:', {
                    message: e.message,
                    code: e.code,
                    status: e.response?.status,
                    data: e.response?.data,
                });
            } else {
                this.logger.error('Geocoding unknown error:', e);
            }
            return null;
        }
    }
}
