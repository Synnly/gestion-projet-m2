import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import type { userContext } from '../type';
import { toast } from 'react-toastify';
type ProtectedRouteByRoleProps = {
    allowedRoles: string[];
    redirectPath?: string;
};

export const ProtectedRoutesByRole = ({ allowedRoles, redirectPath = '/' }: ProtectedRouteByRoleProps) => {
    const user = useOutletContext<userContext>();
    const location = useLocation();
    if (!user.accessToken) {
        return <Navigate to={redirectPath} replace />;
    }
    const payload = user.get(user.accessToken);
    if (!allowedRoles.includes(payload.role)) {
        toast.error("Vous n'avez pas les permissions nécessaires pour accéder à cette page.", { toastId: 'forbidden' });
        return <Navigate to={redirectPath} replace />;
    }
    return <Outlet context={user} />;
};
