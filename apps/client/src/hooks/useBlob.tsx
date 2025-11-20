import { useQuery } from '@tanstack/react-query';
import { userStore } from '../store/userStore';
/**
A faire évoluer pour le cv
*/
const fetchSignedUrl = async (fileName: string): Promise<string | null> => {
  if (!fileName) return null;
  const url = `${import.meta.env.VITE_APIURL}/api/files/signed/download/${fileName}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération de l'URL signée: ${res.status}`);
  }
  const data = await res.json(); // supposons que ton API retourne { signedUrl: string }
  return data.downloadUrl;

};const fetchFileFromSignedUrl = async (signedUrl: string): Promise<Blob> => {
  const res = await fetch(signedUrl);
  if (!res.ok) {
    throw new Error(`Erreur lors du téléchargement du fichier: ${res.status}`);
  }
  return res.blob();
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
