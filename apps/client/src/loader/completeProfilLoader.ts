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
    const API_URL = import.meta.env.VITE_APIURL;
    const { access, get } = userStore.getState();
    const { setProfil, profile } = profileStore.getState();
    const pathname = request.url;
    if (!access) return;

    const payload = get(access);

    if (pathname === '/verify' && payload.isVerified) {
        return redirect(`/${payload.role.toLowerCase()}/dashboard`);
    }

    if (pathname !== '/verify' && !payload.isVerified) {
        return redirect('/verify');
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
        return redirect('/complete-profil');
    }

    if (isProfilComplete(newProfile.profile) && request.url.endsWith('/complete-profil')) {
        return redirect(`/${payload.role.toLowerCase()}/dashboard`);
    }
};
