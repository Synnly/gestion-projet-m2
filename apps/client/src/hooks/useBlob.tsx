import { useQuery } from '@tanstack/react-query';
import { userStore } from '../store/userStore';

/**
 * Fetch signed download URL from backend
 */
const fetchSignedUrl = async (fileName: string): Promise<string | null> => {
    if (!fileName) return null;

    const url = `${import.meta.env.VITE_APIURL}/api/files/signed/download/${encodeURIComponent(fileName)}`;

    try {
        // Add timeout to prevent hanging forever
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            return null;
        }
        const data = await res.json();
        return data.downloadUrl || null;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
        } else {
        }
        return null;
    }
};

export const fetchFileFromSignedUrl = async (signedUrl: string): Promise<Blob | null> => {
    try {
        const res = await fetch(signedUrl);
        if (!res.ok) {
            return null;
        }
        return res.blob();
    } catch (error) {
        return null;
    }
};

/**
 * Fetch public signed URL (for company logos)
 * No ownership verification on backend
 */
export const fetchPublicSignedUrl = async (fileName: string): Promise<string | null> => {
    if (!fileName) return null;
    const url = `${import.meta.env.VITE_APIURL}/api/files/signed/public/${fileName}`;

    try {
        const controller = new AbortController();

        const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
        });

        const data = await res.json();

        return data.downloadUrl || null;
    } catch (error) {
        return null;
    }
};

/**
 * Hook to get blob from MinIO storage
 * @param fileName - The fileName of your file (e.g., "userId_logo.png")
 * @returns Blob data or null if loading/error
 */
export const useBlob = (fileName: string) => {
    const userId = userStore((state) => state.get(state.access)?.id ?? null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['file', userId, fileName],
        queryFn: async () => {
            const signedUrl = await fetchSignedUrl(fileName);
            if (!signedUrl) return null;
            const blob = await fetchFileFromSignedUrl(signedUrl);
            return blob;
        },
        enabled: !!fileName && !!userId,
        staleTime: 1000 * 60 * 60, // cache 1h
        retry: 1, // Retry once on failure
        gcTime: 1000 * 60 * 60, // Keep in cache for 1h
    });

    if (!fileName || isLoading || isError) return null;

    return data || null;
};

/**
 * Hook to get public signed URL from backend with caching
 * @param fileName - The fileName of your file (e.g., "logo.png")
 * @param enabled - Whether the query should run (default: true when fileName exists)
 * @returns { data: string | null, isLoading: boolean, isError: boolean }
 */
export const usePublicSignedUrl = (fileName: string | null, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['publicSignedUrl', fileName],
        queryFn: async () => {
            if (!fileName) return null;
            return await fetchPublicSignedUrl(fileName);
        },
        enabled: !!fileName && enabled,
        staleTime: 1000 * 60 * 30, // cache 30 min
        retry: 1,
        gcTime: 1000 * 60 * 60, // Keep in cache for 1h
    });
};
