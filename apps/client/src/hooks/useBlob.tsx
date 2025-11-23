import { useQuery } from '@tanstack/react-query';
import { userStore } from '../store/userStore';

/**
 * Fetch signed download URL from backend
 */
const fetchSignedUrl = async (fileName: string): Promise<string | null> => {
  if (!fileName) return null;
  
  const url = `${import.meta.env.VITE_APIURL}/api/files/signed/download/${encodeURIComponent(fileName)}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération de l'URL signée: ${res.status}`);
  }
  
  const data = await res.json();
  return data.downloadUrl;
};

/**
 * Fetch file blob from signed URL
 */
const fetchFileFromSignedUrl = async (signedUrl: string): Promise<Blob> => {
  const res = await fetch(signedUrl);
  if (!res.ok) {
    throw new Error(`Erreur lors du téléchargement du fichier: ${res.status}`);
  }
  return res.blob();
};

/**
 * Hook to get blob from MinIO storage
 * @param fileName - The fileName of your file (e.g., "userId_logo.png")
 * @returns Blob data or null if loading/error
 */
export const useBlob = (fileName: string) => {
  const userId = userStore((state) => state.get(state.access!)?.id);
  
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
