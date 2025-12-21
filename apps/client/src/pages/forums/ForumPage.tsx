import { useNavigation } from 'react-router-dom';
import { useParams } from 'react-router';
import { Navbar } from '../../components/navbar/Navbar.tsx';
import Spinner from '../../components/Spinner/Spinner.tsx';
import { useFetchForumByCompanyId, useFetchGeneralForum } from '../../hooks/useFetchForum.ts';
import { ForumHeader } from '../../components/forum/ForumHeader.tsx';
import { TopicRow } from '../../components/forum/TopicRow.tsx';
import Pagination from '../../components/ui/pagination/Pagination.tsx';
import { SearchBar } from '../../components/inputs/searchBar';

type Props = {
    isGeneral?: boolean;
};

export function ForumPage({ isGeneral = false }: Props) {
    const navigation = useNavigation();
    const companyId = useParams().companyId!;
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

    const mockTopics = [
        {
            _id: '1',
            title: 'Bienvenue sur le forum',
            description: 'Présentez-vous ici',
            author: { _id: '1', firstName: 'Admin', lastName: '', name: 'Admin' },
            nbMessages: 42,
        },
        {
            _id: '2',
            title: 'Questions techniques',
            description: 'Posez vos questions techniques',
            author: { _id: '2', firstName: 'Jean', lastName: 'Dupont', name: 'Jean Dupont' },
            nbMessages: 156,
        },
        {
            _id: '3',
            title: 'Annonces importantes',
            description: 'Les dernières actualités',
            author: { _id: '3', firstName: 'Modérateur', lastName: '', name: 'Modérateur' },
            nbMessages: 23,
        },
        {
            _id: '4',
            title: "Suggestions d'amélioration",
            description: 'Vos idées pour améliorer la plateforme',
            author: { _id: '4', firstName: 'Marie', lastName: 'Martin', name: 'Marie Martin' },
            nbMessages: 89,
        },
        {
            _id: '5',
            title: 'Bugs et problèmes',
            description: 'Signalez les problèmes rencontrés',
            author: { _id: '5', firstName: 'Pierre', lastName: 'Leroy', name: 'Pierre Leroy' },
            nbMessages: 67,
        },
        {
            _id: '6',
            title: 'Tutoriels et guides',
            description: 'Partagez vos connaissances',
            author: { _id: '6', firstName: 'Sophie', lastName: 'Bernard', name: 'Sophie Bernard' },
            nbMessages: 134,
        },
        {
            _id: '7',
            title: 'Événements à venir',
            description: 'Calendrier des événements',
            author: { _id: '7', firstName: 'Admin', lastName: '', name: 'Admin' },
            nbMessages: 45,
        },
        {
            _id: '8',
            title: 'Discussions générales',
            description: 'Pour tout et rien',
            author: { _id: '8', firstName: 'Thomas', lastName: 'Petit', name: 'Thomas Petit' },
            nbMessages: 203,
        },
        {
            _id: '9',
            title: 'Partenariats',
            description: 'Opportunités de collaboration',
            author: { _id: '9', firstName: 'Claire', lastName: 'Dubois', name: 'Claire Dubois' },
            nbMessages: 78,
        },
        {
            _id: '10',
            title: 'Ressources utiles',
            description: 'Liens et documents importants',
            author: { _id: '10', firstName: 'Luc', lastName: 'Moreau', name: 'Luc Moreau' },
            nbMessages: 91,
        },
    ];

    if (forum) forum!.topics = mockTopics;

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
                        {forum && <ForumHeader forum={forum} />}
                        <div>
                            {/*TODO: Implémenter la recherche*/}
                            <SearchBar
                                searchQuery={''}
                                setSearchQuery={(_: string) => null}
                                selects={[]}
                                placeholder={'Rechercher par sujet ...'}
                            />
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
                                        <TopicRow topic={topic} key={topic._id} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/*TODO : Implémenter la pagination*/}
                        <Pagination page={1} totalPages={2} onPageChange={(_: number) => null} />
                    </div>
                </div>
            )}
        </div>
    );
}
