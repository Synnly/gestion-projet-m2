import { redirect, useOutletContext } from 'react-router';
import { type userContext } from '..';
import { Outlet } from 'react-router';

/**
 * @description Middleware which verify if user is students. must be used within AuthRoutes
 */

export const StudentsRoute = () => {
    const user = useOutletContext<userContext>();
    if (!user) throw new Error('Must be used within authRoutes or something with give user as outlet context ');
    if (!user.role.includes('STUDENTS')) throw redirect('/');
    return <Outlet />;
};
