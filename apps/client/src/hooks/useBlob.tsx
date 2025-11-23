import { useQuery } from '@tanstack/react-query';
import { userStore } from '../store/userStore';
/**
A faire évoluer pour le cv
*/
export const fetchSignedUrl = async (fileName: string): Promise<string | null> => {
  if (!fileName) return null;
  const url = `${import.meta.env.VITE_APIURL}/api/files/signed/download/${fileName}`;

  try {
    console.debug(`[fetchSignedUrl] Requesting: ${url}`);
    
    // Add timeout to prevent hanging forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.debug(`[fetchSignedUrl] Response status: ${res.status}`);

    if (!res.ok) {
      console.warn(`[fetchSignedUrl] HTTP ${res.status} for ${fileName}`);
      return null;
    }
    const data = await res.json();
    console.debug(`[fetchSignedUrl] Response data:`, data);
    return data.downloadUrl || null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[fetchSignedUrl] Timeout after 10s for ${fileName}`);
    } else {
      console.error(`[fetchSignedUrl] Error for ${fileName}:`, error);
    }
    return null;
  }
};

export const fetchFileFromSignedUrl = async (signedUrl: string): Promise<Blob | null> => {
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) {
      console.warn(`[fetchFileFromSignedUrl] HTTP ${res.status}`);
      return null;
    }
    return res.blob();
  } catch (error) {
    console.error(`[fetchFileFromSignedUrl] Error:`, error);
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
*@description hook to get blob of minio
*@param fileName the fileName of your file
**/
export const useBlob = (fileName: string) => {
  const userId = userStore((state) => state.get(state.access!)?.id);
  const { data, isLoading } = useQuery({
    queryKey: ['file', userId, fileName],
    queryFn: async () => {
      const signedUrl = await fetchSignedUrl(fileName);
      if (!signedUrl) return null;
      const blob = await fetchFileFromSignedUrl(signedUrl);
      return blob
    },
    enabled: !!fileName && !!userId,
    staleTime: 1000 * 60 * 60, // cache 1h
  });

  if (!fileName || isLoading) return null;

  return data;
};
