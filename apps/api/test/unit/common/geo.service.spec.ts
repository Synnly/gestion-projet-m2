import axios from 'axios';
import { GeoService } from '../../../src/common/geography/geo.service';

jest.mock('axios');

describe('GeoService', () => {
    const mockGet = jest.fn();

    beforeEach(() => {
        (axios.create as unknown as jest.Mock).mockReturnValue({ get: mockGet });
        (axios.isAxiosError as unknown as jest.Mock) = jest.fn((e) => e && e.isAxiosError);
        mockGet.mockReset();
    });

    it('returns coordinates when provider returns data', async () => {
        mockGet.mockResolvedValue({ data: [{ lat: '48.8566', lon: '2.3522' }] });
        const svc = new GeoService();
        const res = await svc.geocodeAddress('Paris, France');
        expect(res).toEqual([2.3522, 48.8566]);
    });

    it('returns null when provider returns empty array', async () => {
        mockGet.mockResolvedValue({ data: [] });
        const svc = new GeoService();
        const res = await svc.geocodeAddress('Unknown place');
        expect(res).toBeNull();
    });

    it('handles axios error and returns null', async () => {
        const err: any = new Error('timeout');
        err.isAxiosError = true;
        err.code = 'ECONNABORTED';
        mockGet.mockRejectedValue(err);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const svc = new GeoService();
        const res = await svc.geocodeAddress('Nowhere');
        expect(res).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('handles non-axios error and logs unknown error', async () => {
        const err = new Error('unexpected');
        // ensure isAxiosError returns false
        (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
        mockGet.mockRejectedValue(err);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const svc = new GeoService();
        const res = await svc.geocodeAddress('Nowhere');
        expect(res).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('Geocoding unknown error:', err);
        consoleSpy.mockRestore();
    });
});
