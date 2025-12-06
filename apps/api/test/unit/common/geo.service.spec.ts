import axios from 'axios';
import { GeoService } from '../../../src/common/geography/geo.service';

jest.mock('axios');
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

    it('rate-limits when called too soon (waits before API call)', async () => {
        // Spy and short-circuit setTimeout so test does not actually wait
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((cb: Function, _ms?: number) => {
            cb();
            return {} as unknown as NodeJS.Timeout;
        });

        mockGet.mockResolvedValue({ data: [{ lat: '48.8566', lon: '2.3522' }] });

        const svc = new GeoService();
        svc['lastApiCallTime'] = Date.now();

        const res = await svc.geocodeAddress('Paris, France');

        expect(setTimeoutSpy).toHaveBeenCalled();
        expect(mockGet).toHaveBeenCalled();
        expect(res).toEqual([2.3522, 48.8566]);
    });

    it('caches results and avoids repeated API calls', async () => {
        mockGet.mockResolvedValue({ data: [{ lat: '48.8566', lon: '2.3522' }] });

        const svc = new GeoService();
        const first = await svc.geocodeAddress('Paris');
        const second = await svc.geocodeAddress('Paris');

        expect(first).toEqual([2.3522, 48.8566]);
        expect(second).toEqual([2.3522, 48.8566]);
        expect(mockGet).toHaveBeenCalledTimes(1);
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

        const svc = new GeoService();
        const loggerSpy = jest.spyOn((svc as any).logger, 'error').mockImplementation(() => {});
        const res = await svc.geocodeAddress('Nowhere');
        expect(res).toBeNull();
        expect(loggerSpy).toHaveBeenCalled();
        loggerSpy.mockRestore();
    });

    it('handles non-axios error and logs unknown error', async () => {
        const err = new Error('unexpected');
        // ensure isAxiosError returns false
        (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
        mockGet.mockRejectedValue(err);

        const svc = new GeoService();
        const loggerSpy = jest.spyOn((svc as any).logger, 'error').mockImplementation(() => {});
        const res = await svc.geocodeAddress('Nowhere');
        expect(res).toBeNull();
        expect(loggerSpy).toHaveBeenCalledWith('Geocoding unknown error:', err);
        loggerSpy.mockRestore();
    });
});
