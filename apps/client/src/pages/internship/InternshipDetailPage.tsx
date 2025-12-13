import { Link, useLoaderData } from 'react-router-dom';
import InternshipDetail from '../../modules/internship/InternshipDetail';
import { Navbar } from '../../components/navbar/Navbar';
import { useQuery } from '@tanstack/react-query';
import { fetchInternshipById } from '../../hooks/useFetchInternships';
import { hydrate, useQueryClient } from '@tanstack/react-query';
import Spinner from '../../components/Spinner/Spinner';
import type { Internship, PaginationResult } from '../../types/internship.types';
import { useInternshipStore } from '../../store/useInternshipStore';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function InternshipDetailPage() {
    const { id, dehydratedState } = useLoaderData() as { id?: string; dehydratedState?: unknown };
    const queryClient = useQueryClient();
    if (dehydratedState) {
        hydrate(queryClient, dehydratedState);
    }
    const filters = useInternshipStore((s) => s.filters);
    const cachedList = queryClient.getQueryData(['internships', filters]) as PaginationResult<Internship> | undefined;
    const cachedItem = cachedList?.data?.find((p) => p._id === id) ?? undefined;

    const {
        data: internship,
        isLoading,
        isError,
    } = useQuery<Internship | null, Error>({
        queryKey: ['internship', id],
        queryFn: () => fetchInternshipById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        initialData: () => cachedItem ?? undefined,
    });

    const removeInternshipsByIds = useInternshipStore((s) => s.removeInternshipsByIds);

    useEffect(() => {
        if (internship && !internship.company) {
            // Remove from store and notify
            removeInternshipsByIds([internship._id]);
            try {
                toast.error(`Impossible d'afficher 1 stage(s)`, { toastId: 'fetch-internship-detail' });
            } catch (e) {}
        }
    }, [internship, removeInternshipsByIds, toast]);

    return (
        <div className="px-8">
            <Navbar />
            <main className="flex w-full flex-1 justify-center py-8">
                <div className="w-full max-w-5xl px-4 md:px-8">
                    {isLoading ? (
                        <>
                            <Spinner />
                            <div className="card bg-base-100 rounded-xl p-6 opacity-70">
                                <h2 className="text-xl font-bold">Chargement…</h2>
                                <p className="mt-2 text-sm text-base-content/70">
                                    Récupération des informations du stage.
                                </p>
                            </div>
                        </>
                    ) : isError ? (
                        <div className="card bg-base-100 rounded-xl p-6">
                            <h2 className="text-xl font-bold">Erreur</h2>
                            <p className="mt-2 text-sm text-base-content/70">Impossible de récupérer ce stage.</p>
                            <div className="mt-4">
                                <Link to="/internships/list" className="btn btn-primary">
                                    Retour à la liste
                                </Link>
                            </div>
                        </div>
                    ) : internship ? (
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-12 lg:col-span-8">
                                <div className="card bg-base-100 rounded-xl p-6">
                                    <h1 className="text-3xl font-extrabold mb-4">{internship.title}</h1>
                                    <p className="text-sm text-base-content/70 mb-6">
                                        {internship.company.name} • {internship.adress}
                                    </p>
                                    <InternshipDetail internship={internship} />
                                </div>
                            </div>

                            <aside className="col-span-12 lg:col-span-4">
                                <div className="card bg-base-100 rounded-xl p-6 sticky top-24">
                                    <h3 className="text-lg font-bold">À propos de ce poste</h3>
                                    <ul className="mt-3 space-y-2 text-sm text-base-content/80">
                                        <li>
                                            <strong>Type:</strong> {internship.type}
                                        </li>
                                        <li>
                                            <strong>Durée:</strong> {internship.duration ?? 'N/A'}
                                        </li>
                                        <li>
                                            <strong>Secteur:</strong> {internship.sector ?? 'N/A'}
                                        </li>
                                        <li>
                                            <strong>Ville:</strong> {internship.company.city ?? 'N/A'}
                                        </li>
                                    </ul>

                                    <div className="mt-6">
                                        <Link to="/" className="btn btn-ghost w-full">
                                            Retour à la liste
                                        </Link>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="card bg-base-100 rounded-xl p-6">
                            <h2 className="text-xl font-bold">Stage introuvable</h2>
                            <p className="mt-2 text-sm text-base-content/70">
                                Le stage demandé est introuvable ou n'est pas encore chargé.
                            </p>
                            <div className="mt-4">
                                <Link to="/" className="btn btn-primary">
                                    Retour à la liste
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
