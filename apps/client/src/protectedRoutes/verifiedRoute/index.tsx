import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import type { userContext } from '../type';
export const VerifiedRoutes = ({ redirectPath = '/' }: { redirectPath?: string }) => {
    const user = useOutletContext<userContext>();
    const payload = user.get(user.accessToken);
    console.log(payload)
    if (!user.accessToken) {
        throw new Error('No user context found, use this route with AuthRoutes component ');
    }
    if (!payload.isValid) {
        console.log("pas valid")
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};
