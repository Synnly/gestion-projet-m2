import { redirect } from 'react-router';
import { profileStore, type companyProfileStoreType } from '../store/profileStore';
import { userStore } from '../store/userStore';
import { completeProfilFormCheck } from '../company/completeProfil/type';
import type { companyProfile } from '../types';
import { UseAuthFetch } from '../hooks/useAuthFetch';

/** @description use zod schema to check if required fields of priofil are complete
 * @returns a boolean which indicates if the profil is complete
 */
function isProfilComplete(profile: companyProfile | null): boolean {
    //check
    return profile !== null && completeProfilFormCheck.safeParse(profile).success;
}
/**
 * @description Middleware to ensure user profile completeness and verification status
 * @param {Object} param0 - The request object to get target URL
 */
export const completeProfilMiddleware = async ({ request }: { request: Request }) => {
    await userStore.persist.rehydrate();
    const API_URL = import.meta.env.VITE_APIURL;
    const { access, get } = userStore.getState();
    if (!access) return;
    const payload = get(access);
    if (!payload) return;
    const authFetch = UseAuthFetch();
    const pathname = new URL(request.url).pathname;
    const { setProfil, profile } = profileStore.getState();
    if (!payload.isVerified && pathname === '/verify') {
        return;
    }
    //if user try to access verify and already verified redirect to dashboard
    if (payload.isVerified && pathname === '/verify') {
        throw redirect(`/${payload.role.toLowerCase()}/dashboard`);
    }

    //if user is not verified and is not already on verify page redirect to verify
    if (!payload.isVerified && pathname !== '/verify') {
        throw redirect('/verify');
    }
    if (payload.role === 'COMPANY') {
        if (!profile) {
            const profileRes = await authFetch(`${API_URL}/api/companies/${payload.id}`, {
                headers: {
                    Authorization: `Bearer ${access}`,
                },
            });

            if (!profileRes.ok) {
                return redirect('/signin');
            }

            const newProfile: companyProfile = await profileRes.json();
            setProfil(newProfile);
        }
        const newProfile: companyProfileStoreType = profileStore.getState();

        const isComplete = isProfilComplete(newProfile.profile);
        if (!isComplete && pathname === '/complete-profil') {
            return;
        }
        if (!isComplete && pathname !== '/complete-profil') {
            throw redirect('/complete-profil');
        }

        if (isComplete) {
            const validationRes = await authFetch(`${API_URL}/api/companies/${payload.id}/is-valid`, {
                method: 'GET',
            });

            if (validationRes.ok) {
                const { isValid } = await validationRes.json();

                // If company is not valid yet and user is not already on the pending page, redirect there.
                if (!isValid && pathname !== '/pending-validation') {
                    throw redirect('/pending-validation');
                }

                // If company has become valid while on the pending page, redirect to dashboard.
                if (isValid && pathname === '/pending-validation') {
                    throw redirect(`/${payload.role.toLowerCase()}/dashboard`);
                }
            }
        }
        if (isComplete && pathname === '/complete-profil') {
            throw redirect(`/${payload.role.toLowerCase()}/dashboard`);
        }
    }
};
