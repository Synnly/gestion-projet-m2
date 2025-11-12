import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
type ProtectedRouteByRoleProps = {
    allowedRoles: string[];
    redirectPath?: string;
};

export const ProtectedRouteByRole = ({ allowedRoles, redirectPath = '/' }: ProtectedRouteByRoleProps) => {
    const user = useOutletContext<{ access: string; role: string; isVerified: boolean }>();

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={redirectPath} replace />;
    }
    return <Outlet context={user} />;
};
