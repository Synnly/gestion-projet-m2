import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Geocode addresses via Nominatim and return `[lon, lat]` or `null`.
 * Uses an in-memory cache and rate-limit (1 req/s) to minimize external calls.
 * Short timeout and logged failures; service does not throw to callers.
 * Failures are cached briefly to avoid immediate retries; use Redis in prod for multi-instance.
 */
@Injectable()
export class GeoService {
    private readonly logger = new Logger(GeoService.name);

    // In-memory cache for geocoding results (prevents repeated API calls for same addresses)
    // Key: normalized address (lowercase, trimmed), Value: [lon, lat] or null
    // Production: consider Redis or @nestjs/cache-manager for distributed cache
    private readonly geocodeCache = new Map<string, [number, number] | null>();

    // Rate limiting: track last API call timestamp to respect OpenStreetMap's usage policy (1 req/sec)
    private lastApiCallTime = 0;
    private readonly MIN_API_INTERVAL_MS = 1000; // 1 second between API calls

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
     * Results are cached in memory to avoid redundant API calls.
     *
     * @param address - Human readable address (street, city, country...)
     * @returns `[lon, lat]` on success or `null` when geocoding fails or
     *          no result is found. Failures are logged but do not throw.
     */
    async geocodeAddress(address: string): Promise<[number, number] | null> {
        // Normalize address for cache key (case-insensitive, trimmed)
        const cacheKey = address.toLowerCase().trim();

        // Check cache first
        if (this.geocodeCache.has(cacheKey)) {
            this.logger.debug(`Geocoding cache hit for: ${address}`);
            return this.geocodeCache.get(cacheKey)!;
        }

        // Rate limiting: ensure minimum interval between API calls
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCallTime;
        if (timeSinceLastCall < this.MIN_API_INTERVAL_MS) {
            const waitTime = this.MIN_API_INTERVAL_MS - timeSinceLastCall;
            this.logger.debug(`Rate limiting: waiting ${waitTime}ms before API call`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        try {
            this.lastApiCallTime = Date.now();

            const { data } = await this.client.get('/search', {
                params: {
                    format: 'json',
                    q: address,
                    addressdetails: 1,
                    limit: 1,
                },
            });

            if (!data || data.length === 0) {
                this.geocodeCache.set(cacheKey, null);
                return null;
            }

            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const result: [number, number] = [lon, lat];

            // Cache successful result
            this.geocodeCache.set(cacheKey, result);
            this.logger.debug(`Geocoding success for: ${address} -> [${lon}, ${lat}]`);

            return result;
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

            // Cache failure to avoid retrying immediately
            this.geocodeCache.set(cacheKey, null);
            return null;
        }
    }
}
