import { useQuery } from '@tanstack/react-query';
import { userStore } from '../store/userStore';

const fetchFile = async (fileName: string) => {
    if (!fileName) return null;

    const url = `${import.meta.env.VITE_API_URL}/files/signed/download/${fileName}`;

    const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
    });

    if (!res.ok) {
        throw new Error(`Erreur lors du chargement du fichier: ${res.status}`);
    }

    return await res.blob();
};

export const useBlob = (fileName: string) => {
    const userId = userStore((state) => state.get(state.access!)?.id);

    const { data, isPending } = useQuery({
        queryKey: ['file', userId, fileName],
        queryFn: () => fetchFile(fileName),
        enabled: Boolean(fileName && userId),
        staleTime: 1000 * 60 * 60, // cache pendant 1 heure
    });

    if (!fileName) {
        return null;
    }
    if (isPending) {
        return null;
    }
    return data;
};
