import { Navigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userStore } from '../../../store/userStore';
export const VerifiedRoute = ({ redirectPath = '/' }: { redirectPath?: string }) => {
    const user = useOutletContext<{ access: string; role: string; isVerified: boolean }>();
    const API_URL = import.meta.env.VITE_API_URL;
    const setUser = userStore((state) => state.set);

    const { data } = useQuery({
        queryKey: ['fetch-user-verification-status', user.access],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/verified`);
            const data = await res.json();
            return data;
        },
        enabled: !user.isVerified,
        staleTime: 30,
    });
    if (data.isVerified) {
        return <Navigate to={redirectPath} replace />;
    } else {
        setUser(user.access, user.role, data.isVerified);
    }
};
