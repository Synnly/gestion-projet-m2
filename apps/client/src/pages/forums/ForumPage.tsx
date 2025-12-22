import { useState } from 'react';
import { useNavigation } from 'react-router-dom';
import { useParams } from 'react-router';
import { Navbar } from '../../components/navbar/Navbar.tsx';
import Spinner from '../../components/Spinner/Spinner.tsx';
import { useFetchForumByCompanyId, useFetchGeneralForum } from '../../hooks/useFetchForum.ts';
import { useFetchTopics } from '../../hooks/useFetchTopics.ts';
import { ForumHeader } from '../../components/forum/ForumHeader.tsx';
import { TopicRow } from '../../components/forum/TopicRow.tsx';
import Pagination from '../../components/ui/pagination/Pagination.tsx';
import { SearchBar } from '../../components/inputs/searchBar';
import { CreateTopicModal } from '../forum/components/CreateTopicModal.tsx';
import type { Topic } from '../../types/forum.types.ts';

type Props = {
    isGeneral?: boolean;
};

export function ForumPage({ isGeneral = false }: Props) {
    const navigation = useNavigation();
    const companyId = useParams().companyId!;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    let forum;
    let isLoadingForum: boolean;

    if (isGeneral) {
        let { data, isLoading: isLoadingTmp } = useFetchGeneralForum();
        forum = data;
        isLoadingForum = isLoadingTmp;
    } else {
        let { data, isLoading: isLoadingTmp } = useFetchForumByCompanyId(companyId);
        forum = data;
        isLoadingForum = isLoadingTmp;
    }

    const { data: topicsData, isLoading: isLoadingTopics } = useFetchTopics({
        forumId: forum?._id || '',
        page: currentPage,
        limit: 10,
        searchQuery: searchQuery || undefined,
    });

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={false} />
            <Spinner show={navigation.state === 'loading'} />
            {!isLoadingForum && (
                <div className="flex flex-col justify-center p-8 px-80">
                    <div className="breadcrumbs text-sm">
                        <ul>
                            <li>
                                <a href="/forums">Forums</a>
                            </li>
                            <li>{forum?.company?.name ?? 'Général'}</li>
                        </ul>
                    </div>
                    <div className="flex flex-col gap-8">
                        {forum && <ForumHeader forum={forum} onCreateTopic={() => setIsModalOpen(true)} />}

                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <SearchBar
                                    searchQuery={searchQuery}
                                    setSearchQuery={handleSearchChange}
                                    selects={[]}
                                    placeholder={'Rechercher par sujet ...'}
                                />
                            </div>
                        </div>

                        <div>
                            <table className="table table-zebra overflow-x-auto rounded-box border border-base-content/5 bg-base-100 max-w-full">
                                <thead>
                                    <tr>
                                        <td className="w-px whitespace-nowrap">Sujet</td>
                                        <td>Description</td>
                                        <td className="w-px whitespace-nowrap">Auteur</td>
                                        <td className="w-px whitespace-nowrap text-right">Messages</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingTopics ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8">
                                                <span className="loading loading-spinner loading-md"></span>
                                            </td>
                                        </tr>
                                    ) : (
                                        topicsData?.data?.map((topic: Topic) => (
                                            <TopicRow
                                                topic={topic}
                                                key={topic._id}
                                                companyId={companyId}
                                                forumId={forum?._id || ''}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            page={topicsData?.page || 1}
                            totalPages={topicsData?.totalPages || 1}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            )}

            <CreateTopicModal forumId={forum?._id || ''} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
