import { UseAuthFetch } from './useAuthFetch';

export async function fetchCompanyProfiles(companyIds: string[], API_URL: string) {
    const authFetch = UseAuthFetch();
    return Promise.all(
        companyIds.map(async (id) => {
            const res = await authFetch(`${API_URL}/api/companies/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) return { companyId: id, logo: null };

            const json = await res.json().catch(() => null);
            return { companyId: id, logo: json?.logo ?? null };
        }),
    );
}
