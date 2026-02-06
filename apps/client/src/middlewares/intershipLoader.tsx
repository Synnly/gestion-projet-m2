import { dehydrate, QueryClient } from '@tanstack/react-query';
import { fetchInternshipById } from '../hooks/useFetchInternships';

export const internshipLoader = async ({ params }: { params: { id?: string } }) => {
    const id = params?.id;
    if (!id) throw new Response('Missing id', { status: 400 });
    const qc = new QueryClient();
    try {
        await qc.fetchQuery({
            queryKey: ['internship', id],
            queryFn: () => fetchInternshipById(id),
        });
    } catch (e: unknown) {
        if (e instanceof Error && e.message === 'Internship not found') {
            throw new Response('Not found', { status: 404 });
        }
    }

    return { id, dehydratedState: dehydrate(qc) };
};
