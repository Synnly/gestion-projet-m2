import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import type { userContext } from '../type';
type ProtectedRouteByRoleProps = {
    allowedRoles: string[];
    redirectPath?: string;
};

export const ProtectedRoutesByRole = ({ allowedRoles, redirectPath = '/' }: ProtectedRouteByRoleProps) => {
    const user = useOutletContext<userContext>();
    const payload = user.get(user.accessToken);
    if (!allowedRoles.includes(payload.role)) {
        return <Navigate to={redirectPath} replace />;
    }
    return <Outlet context={user} />;
};
