import { Navigate, Outlet, useOutletContext, useParams } from 'react-router-dom';
import type { userContext } from '../type';
import { toast } from 'react-toastify';

export const CompanyForumRoute = () => {
    const user = useOutletContext<userContext>();
    const { companyId } = useParams<{ companyId: string }>();

    if (!companyId) {
        return <Outlet context={user} />;
    }

    if (!user.accessToken) {
        return <Navigate to="/signin" replace />;
    }

    const payload = user.get(user.accessToken);

    if (payload.role === 'STUDENT' || payload.role === 'ADMIN') {
        return <Outlet context={user} />;
    }

    if (payload.role === 'COMPANY') {
        if (payload.id === companyId || companyId === undefined) {
            return <Outlet context={user} />;
        }
        toast.error("Vous n'avez pas accès au forum de cette entreprise.", { toastId: 'forbidden-forum' });
        return <Navigate to="/forums" replace />;
    }

    toast.error("Vous n'avez pas les permissions nécessaires pour accéder à cette page.", { toastId: 'forbidden' });
    return <Navigate to="/forums" replace />;
};
