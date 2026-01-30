import { redirect } from 'react-router-dom';
import { userStore } from '../store/userStore';

/**
 * @description loader which check if user is not connected
 *
 */
export const notAuthMiddleWare = () => {
    const access = userStore.getState().access;
    const get = userStore.getState().get;
    if (access) {
        const payload = get(access);
        if (!payload) {
            return redirect('/');
        }
        return redirect(`/${payload.role.toLowerCase()}/dashboard`);
    }
};
