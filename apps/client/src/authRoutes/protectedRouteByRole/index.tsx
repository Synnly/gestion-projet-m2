import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { userStore } from '../../store/userStore';
type ProtectedRouteByRoleProps = {
    allowedRoles: string[];
    redirectPath?: string;
};

export const ProtectedRouteByRole = ({ allowedRoles, redirectPath = '/' }: ProtectedRouteByRoleProps) => {
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
        gcTime: 30,
    });
    if (data.isVerified) {
        return <Navigate to={redirectPath} replace />;
    } else {
        setUser(user.access, user.role, data.isVerified);
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={redirectPath} replace />;
    }
    return <Outlet />;
};
