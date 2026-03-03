import { redirect } from 'react-router';
import { profileStore, type companyProfileStoreType } from '../stores/profileStore';
import { userStore } from '../stores/userStore';
import { completeProfilFormCheck } from '../types/CompleteProfil.types';
import type { companyProfile } from '../types/CompanyProfile.types';
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

    if (pathname === '/logout') return;

    // User soft-deleted, only allow access to /account-restore
    if (payload.deletedAt) {
        if (pathname === '/account-restore') return;
        throw redirect('/account-restore');
    }

    // User not verified, only allow access to /verify
    if (!payload.isVerified) {
        if (pathname === '/verify') return;
        throw redirect(`/verify`);
    }

    // User is verified, prevent access to /verify
    if (payload.isVerified && pathname === '/verify') throw redirect(`/home`);

    if (payload.role === 'COMPANY') {
        // Fetch company profile if not already in store
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

        // Company is verified but profile is not complete, only allow access to /complete-profil
        if (!isComplete) {
            if (pathname === '/complete-profil') return;
            throw redirect('/complete-profil');
        }

        const validationRes = await authFetch(`${API_URL}/api/companies/${payload.id}/is-valid`, {
            method: 'GET',
        });

        if (!validationRes.ok) {
            console.error(
                `Failed to check company validation status: received HTTP ${validationRes.status} for company ${payload.id}`,
            );
            return;
        }

        const { isValid } = await validationRes.json();
        const isRejected = newProfile.profile?.rejected?.isRejected || false;

        // If profile is complete but not handled by admin yet, redirect to pending validation page
        if (!isValid && !isRejected) {
            if (pathname === '/pending-validation') return;
            throw redirect('/pending-validation');
        }

        if (!isValid && isRejected) {
            const rejectedAt = newProfile.profile?.rejected?.rejectedAt;
            const modifiedAt = newProfile.profile?.rejected?.modifiedAt;

            console.log(`Company ${payload.id} is rejected. Rejected at: ${rejectedAt}, Modified at: ${modifiedAt}`);

            // If rejected but modified after rejection, consider as pending validation and redirect to pending validation page
            if (rejectedAt && modifiedAt && new Date(modifiedAt) > new Date(rejectedAt)) {
                if (pathname === '/pending-validation') return;
                throw redirect('/pending-validation');
            }
            // If rejected and not modified after rejection, redirect to complete profile page
            else {
                if (pathname === '/complete-profil') return;
                throw redirect('/complete-profil');
            }
        }

        // If company is valid, prevent access to complete profile and pending validation pages
        if (isValid && (pathname === '/pending-validation' || pathname === '/complete-profil')) throw redirect(`/home`);
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
