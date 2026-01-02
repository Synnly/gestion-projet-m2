import { redirect } from 'react-router';
import { userStore } from '../store/userStore';
import { UseAuthFetch } from '../hooks/useAuthFetch';
import type { Internship } from '../types/internship.types.ts';
import { fetchPublicSignedUrl } from '../hooks/useBlob.tsx';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

export async function updatePostLoader({ params }: { params: { id?: string } }) {
    const access = userStore.getState().access;
    if (!access) {
        throw redirect('/signin');
    }
    const tokenPayload = userStore.getState().get(access);
    if (!tokenPayload) {
        throw redirect('/signin');
    }
    const companyId = tokenPayload.id;
    const postId = params.id;
    if (!postId) {
        throw redirect('/');
    }
    const authFetch = UseAuthFetch();
    const res = await authFetch(`${API_URL}/api/company/${companyId}/posts/${postId}`);

    if (!res.ok) {
        throw redirect('/');
    }
    const post: Internship = await res.json();

    if (post.company.logoUrl) {
        post.company.logoUrl = (await fetchPublicSignedUrl(post.company.logoUrl)) ?? post.company.logoUrl;
    }

    return { post, companyId, postId };
}
