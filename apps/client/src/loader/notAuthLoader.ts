import { redirect } from 'react-router-dom';
import { userStore } from '../store/userStore';

/**
* @description loader which check if user is not connected
*
*/
export const notAuthLoader = () => {
    const access = userStore.getState().access;
    const get = userStore.getState().get;
    if (access) {
        const payload = get(access);
        return redirect(`/${payload.role.toLowerCase()}/dashboard`);
    }
};
