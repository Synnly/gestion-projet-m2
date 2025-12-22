import { useState } from 'react';
import { useNavigation } from 'react-router-dom';
import { useParams } from 'react-router';
import { Navbar } from '../../components/navbar/Navbar.tsx';
import Spinner from '../../components/Spinner/Spinner.tsx';
import { useFetchForumByCompanyId, useFetchGeneralForum } from '../../hooks/useFetchForum.ts';
import { ForumHeader } from '../../components/forum/ForumHeader.tsx';
import { TopicRow } from '../../components/forum/TopicRow.tsx';
import Pagination from '../../components/ui/pagination/Pagination.tsx';
import { SearchBar } from '../../components/inputs/searchBar';
import { CreateTopicModal } from '../forum/components/CreateTopicModal.tsx';

type Props = {
    isGeneral?: boolean;
};

export function ForumPage({ isGeneral = false }: Props) {
    const navigation = useNavigation();
   
    const companyId = useParams().companyId!;
    const [isModalOpen, setIsModalOpen] = useState(false);

    let forum;
    let isLoading: boolean;

    if (isGeneral) {
        let { data, isLoading: isLoadingTmp } = useFetchGeneralForum();
        forum = data;
        isLoading = isLoadingTmp;
    } else {
        let { data, isLoading: isLoadingTmp } = useFetchForumByCompanyId(companyId);
        forum = data;
        isLoading = isLoadingTmp;
    }
    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={false} />
            <Spinner show={navigation.state === 'loading'} />
            {!isLoading && (
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
                                    searchQuery={''}
                                    setSearchQuery={(_: string) => null}
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
                                    {forum?.topics?.map((topic) => (
                                            <TopicRow topic={topic} key={topic._id} companyId={companyId} forumId={forum._id} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination page={1} totalPages={2} onPageChange={(_: number) => null} />
                    </div>
                </div>
            )}

            <CreateTopicModal forumId={forum?._id || ''} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
