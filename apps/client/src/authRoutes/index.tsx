import { redirect } from 'react-router';
import { userStore } from '../store/userStore';
import { Outlet } from 'react-router';

export type userContext = {
    id: string;
    role: string[];
};
/**
 * @description Middleware which verify if user is authenticated.
 *
 */
export const AuthRoutes = () => {
    const user: userContext | null = userStore((state) => state.user);
    if (!user) {
        throw redirect('/');
    }
    return <Outlet context={user} />;
};
