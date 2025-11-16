import { userStore } from '../store/userStore';
import { Outlet } from 'react-router';
/**
 * @description Function which refresh user session.
 *  @returns {Promise<string>} - The refreshed access token.
 */

/**
 * @description Middleware which verify if user is authenticated.
 *
 */
export const AuthRoutes = () => {
    const access = userStore((state) => state.access);
    const get = userStore((state) => state.get);
    return <Outlet context={{ access, get }} />;
};
