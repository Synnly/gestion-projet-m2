import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import InternshipCard from './InternshipCard';

import InternshipPagination from './InternshipPagination';
import { useFetchInternships } from '../../../hooks/useFetchInternships';
import { useInternshipStore } from '../../../stores/useInternshipStore';
import ListContainer from '../../common/ui/list/ListContainer';
import { userStore } from '../../../stores/userStore';
import { useApplicationCounts } from '../../../hooks/useFetchApplications';

const InternshipList: React.FC = () => {
    const [date, setDate] = useState(localStorage.getItem('last_post_sync'));
    const [sessionLocked, setSessionLocker] = useState(false);
    const hasShownSeparatorRef = useRef(false);
    hasShownSeparatorRef.current = false;
    const listRef = useRef<HTMLDivElement>(null);
    const thresholdTime = date ? new Date(date).getTime() : null;
    const { isLoading, isError, error } = useFetchInternships();
    const internships = useInternshipStore((state) => state.internships);
    const selectedInternshipId = useInternshipStore((state) => state.selectedInternshipId);
    const resetFilters = useInternshipStore((state) => state.resetFilters);
    useEffect(() => {
        resetFilters();
    }, [resetFilters]);

    const access = userStore((s) => s.access);
    const getUser = userStore((s) => s.get);
    const user = getUser(access);
    const isCompany = user?.role === 'COMPANY';
    const companyId = isCompany ? user?.id : undefined;
    const shouldShowSeparator = useRef(false);
    shouldShowSeparator.current = false;
    const { data: countsData } = useApplicationCounts(companyId);
    useEffect(() => {
        const handleGlobalClick = (ev: globalThis.MouseEvent) => {
            if (shouldShowSeparator.current && listRef.current?.contains(ev.target as Node)) {
                setSessionLocker(true);
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);
    const countsMap = useMemo(() => {
        if (!countsData) return new Map();
        return new Map(countsData.map((c) => [c.postId, c]));
    }, [countsData]);

    // État de chargement
    if (isLoading) {
        return (
            <ListContainer>
                <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                        <p className="text-sm text-base-content/60">Chargement...</p>
                    </div>
                </div>
            </ListContainer>
        );
    }

    // État d'erreur
    if (isError) {
        return (
            <ListContainer>
                <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-error">Erreur: {error?.message || 'Une erreur est survenue'}</p>
                    </div>
                </div>
            </ListContainer>
        );
    }

    // Liste vide
    if (internships.length === 0) {
        return (
            <ListContainer>
                <div className="flex min-h-[200px] items-center justify-center">
                    <p className="text-sm text-base-content/60">Aucun stage trouvé</p>
                </div>
            </ListContainer>
        );
    }

    return (
        <>
            <ListContainer>
                <div className="space-y-3 p-3 h-full overflow-y-auto" ref={listRef}>
                    {internships.map((internship, index) => {
                        const postTime = new Date(internship.createdAt).getTime();
                        let showSeparator = false;
                        if (thresholdTime && postTime <= thresholdTime && !hasShownSeparatorRef.current) {
                            if (index !== 0) {
                                shouldShowSeparator.current = true;
                                showSeparator = true;
                            }

                            hasShownSeparatorRef.current = true;
                        }

                        return (
                            <Fragment key={internship._id}>
                                {showSeparator && !sessionLocked && !isCompany && (
                                    <div className="py-6 flex items-center">
                                        <div className="grow border-t border-gray-300"></div>
                                        <span className="mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                            Anciennes annonces vues
                                        </span>
                                        <div className="grow border-t border-gray-300"></div>
                                    </div>
                                )}
                                <InternshipCard
                                    key={internship._id}
                                    internship={internship}
                                    isSelected={internship._id === selectedInternshipId}
                                    counts={isCompany ? countsMap.get(internship._id) : undefined}
                                />
                            </Fragment>
                        );
                    })}
                </div>
            </ListContainer>
            <div className="mt-2">
                <InternshipPagination />
            </div>
        </>
    );
};

export default InternshipList;
