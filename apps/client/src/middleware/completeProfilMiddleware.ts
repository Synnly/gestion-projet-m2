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
    console.log('Middleware payload:', payload);
    if (!payload) return;
    const authFetch = UseAuthFetch();
    const pathname = new URL(request.url).pathname;
    const { setProfil, profile } = profileStore.getState();
    if (pathname === '/logout') {
        return;
    }
    if (!payload.isVerified && pathname === '/verify') {
        return;
    }
    //if user try to access verify and already verified redirect to dashboard
    if (payload.isVerified && pathname === '/verify') {
        throw redirect(`/home`);
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
        const isRejected = newProfile.profile?.rejected?.isRejected || false;
        const rejectedAt = newProfile.profile?.rejected?.rejectedAt;
        const modifiedAt = newProfile.profile?.rejected?.modifiedAt;

        // Vérifier si l'entreprise a modifié son profil après le rejet
        console.log('isRejected:', isRejected, 'rejectedAt:', rejectedAt, 'modifiedAt:', modifiedAt);
        const hasModifiedAfterRejection =
            isRejected && rejectedAt && modifiedAt && new Date(modifiedAt) > new Date(rejectedAt);
        // Si rejeté mais modifié après rejet et profil complet, considérer comme en attente de validation
        if (hasModifiedAfterRejection && isComplete) {
            if (pathname !== '/pending-validation') {
                throw redirect('/pending-validation');
            }
            return;
        }

        // Si rejeté et pas encore modifié, redirect vers complete-profil
        if (isRejected && !hasModifiedAfterRejection && pathname !== '/complete-profil') {
            throw redirect('/complete-profil');
        }

        // Si sur complete-profil page et rejeté (sans modification récente), permettre de rester
        if (isRejected && !hasModifiedAfterRejection && pathname === '/complete-profil') {
            return;
        }

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

            if (!validationRes.ok) {
                console.error(
                    `Failed to check company validation status: received HTTP ${validationRes.status} for company ${payload.id}`,
                );
                // Allow navigation to continue to avoid degrading UX on transient failures.
                return;
            }

            const { isValid } = await validationRes.json();
            if (!isValid && pathname !== '/pending-validation') {
                throw redirect('/pending-validation');
            }

            // If company has become valid while on the pending page, redirect to dashboard.
            if (isValid && pathname === '/pending-validation') {
                throw redirect(`/home`);
            }
        }

        if (isComplete && pathname === '/complete-profil' && !isRejected) {
            throw redirect(`/home`);
        }
    }
    if (payload.role === 'STUDENT') {
        // Fetch student profile to check isFirstTime
        const studentRes = await authFetch(`${API_URL}/api/students/${payload.id}`, {});

        if (!studentRes.ok) {
            return redirect('/signin');
        }

        const studentProfile = await studentRes.json();
        const isFirstTime = studentProfile.isFirstTime;

        if (isFirstTime && pathname === '/student/changePassword') {
            return;
        }
        if (isFirstTime && pathname !== '/student/changePassword') {
            throw redirect('/student/changePassword');
        }
        if (!isFirstTime && pathname === '/student/changePassword') {
            throw redirect('/home');
        }
    }
};
