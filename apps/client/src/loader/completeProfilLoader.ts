import { redirect } from 'react-router';
import { profileStore } from '../store/profileStore';
import { userStore } from '../store/userStore';
import { type completeProfilFormType, completeProfilFormCheck } from '../company/completeProfil/type';
/** @description use zod schema to check if required fields of priofil are complete
 * @returns a boolean which indicates if the profil is complete
 */
function isProfilComplete(profile: completeProfilFormType | null): boolean {
    //check
    return profile !== null && completeProfilFormCheck.safeParse(profile).success;
}
export const completeProfilLoader = async ({ request }: { request: Request }) => {
    await userStore.persist.rehydrate();
    const API_URL = import.meta.env.VITE_APIURL;
    const { access, get } = userStore.getState();
    const { setProfil, profile } = profileStore.getState();
    const pathname = new URL(request.url).pathname;
    if (!access) return;
    console.log('completeProfilLoader called');
    const payload = get(access);
    if (!payload.isVerified && pathname === '/verify') {
        return;
    }
    if (!isProfilComplete(profile) && pathname === '/complete-profil') {
        return;
    }
    //if user try to access verify and already verified redirect to dashboard
    if (payload.isVerified && pathname === '/verify') {
        throw redirect(`/${payload.role.toLowerCase()}/dashboard`);
    }

    //if user is not verified and is not already on verify page redirect to verify
    if (!payload.isVerified && pathname !== '/verify') {
        throw redirect('/verify');
        return null;
    }

    if (!profile) {
        const profileRes = await fetch(`${API_URL}/api/companies/${payload.id}`, {
            credentials: 'include',
            headers: {
                Authorization: `Bearer ${access}`,
            },
        });

        if (!profileRes.ok) {
            return redirect('/signin');
        }

        const newProfile: completeProfilFormType = await profileRes.json();
        setProfil(newProfile);
    }
    const newProfile = profileStore.getState();
    if (!isProfilComplete(newProfile.profile) && request.url.endsWith('/complete-profil') === false) {
        throw redirect('/complete-profil');
    }
    if (isProfilComplete(newProfile.profile) && request.url.endsWith('/complete-profil')) {
        throw redirect(`/${payload.role.toLowerCase()}/dashboard`);
    }
};
