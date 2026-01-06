import { Navbar } from '../../components/navbar/Navbar.tsx';
import Spinner from '../../components/Spinner/Spinner.tsx';
import { useNavigation } from 'react-router-dom';
import type { Forum } from '../../types/forum.types.ts';
import { ForumCard } from '../../components/forum/ForumCard.tsx';
import { TopicRow } from '../../components/forum/TopicRow.tsx';
import { SearchBar } from '../../components/inputs/searchBar';
import { formatNumber } from '../../utils/format.ts';
import { forumStore } from '../../store/forumStore.ts';
import {
    fetchForumByCompanyId,
    useFetchForumByCompanyId,
    useFetchForums,
    useFetchGeneralForum,
} from '../../hooks/useFetchForum.ts';
import { userStore } from '../../store/userStore.ts';
import { useQuery } from '@tanstack/react-query';
import { UseAuthFetch } from '../../hooks/useAuthFetch.tsx';

export function MainForumPage() {
    const apiUrl = import.meta.env.VITE_APIURL;
    const navigation = useNavigation();
    const filters = forumStore((state) => state.filters);
    const setFilters = forumStore((state) => state.setFilters);
    const { isError: isErrorForums } = useFetchForums();
    const { isError: isErrorGeneral } = useFetchGeneralForum();
    const access = userStore((state) => state.access);
    const get = userStore((state) => state.get);
    const { id, role } = get(access)!;
    const authFetch = UseAuthFetch();
    const forums: Forum[] = forumStore((state) => state.forums);
    const generalForum: Forum = forumStore((state) => state.generalForum)!;
    const handleSearchChange = (query: string) => {
        setFilters({ companyName: query || undefined, page: 1, limit: 12 });
    };
    console.log(apiUrl);
    const companyForum = useFetchForumByCompanyId(id);
    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={false} />
            <Spinner show={navigation.state === 'loading'} />
            <div className="flex flex-col flex-1 justify-center gap-8 p-8">
                <div className="flex flex-col items-center">
                    <div className="flex w-fit text-4xl font-bold">Forums</div>
                    <div className="flex w-fit">Échangez, posez vos questions et partagez vos expériences.</div>
                </div>

                {!isErrorGeneral && generalForum && (
                    <div className=" flex-1 overflow-auto">
                        <div className="card bg-base-100 shadow-sm shadow-base-300 hover:shadow-md hover:bg-base-200 transition-all duration-100 ease-out cursor-pointer">
                            <a href="/forums/general">
                                <div className="card-body flex flex-row justify-between items-center">
                                    <div className="flex flex-row items-center gap-4">
                                        <div className="flex flex-col">
                                            <div className="text-xl font-bold">Forum général</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row items-center gap-8">
                                        <div className="flex flex-row gap-2 items-center">
                                            <div className="text-lg font-bold">
                                                {formatNumber(generalForum.nbTopics ?? 0)}
                                            </div>
                                            <div>sujets</div>
                                        </div>
                                        <div className="flex flex-row gap-2 items-center">
                                            <div className="text-lg font-bold">
                                                {formatNumber(generalForum.nbMessages ?? 0)}
                                            </div>
                                            <div>messages</div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>

                        <table className="table max-w-full">
                            <tbody>
                                {generalForum?.topics?.map((topic) => (
                                    <TopicRow topic={topic} key={topic._id} forumId={generalForum._id} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isErrorForums && role !== 'COMPANY' ? (
                    <div className="w-full flex flex-col gap-2 justify-center">
                        <SearchBar
                            searchQuery={filters.companyName || ''}
                            setSearchQuery={handleSearchChange}
                            selects={[]}
                            placeholder="Rechercher par entreprise ..."
                        />

                        <ul className="w-full space-y-2 flex flex-wrap justify-between">
                            {forums.map((f) => (
                                <ForumCard forum={f} key={f._id} />
                            ))}
                        </ul>
                    </div>
                ) : (
                    <ul className="w-full space-y-2 flex flex-wrap justify-between">
                        {!companyForum.isLoading && companyForum.data && (
                            <ForumCard forum={companyForum.data} key={companyForum.data._id} />
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
