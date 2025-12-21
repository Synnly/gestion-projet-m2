import { Navbar } from '../../components/navbar/Navbar.tsx';
import Spinner from '../../components/Spinner/Spinner.tsx';
import { useNavigation } from 'react-router-dom';
import type { Forum } from '../../types/forum.types.ts';
import { ForumHeader } from '../../components/forum/ForumHeader.tsx';
import { TopicHeader } from '../../components/forum/TopicHeader.tsx';
import { SearchBar } from '../../components/inputs/searchBar';
import { formatNumber } from '../../utils/format.ts';
import { forumStore } from '../../store/forumStore.ts';
import { useFetchForum } from '../../hooks/useFetchForum.ts';
import { useEffect } from 'react';

export function MainForumPage() {
    const navigation = useNavigation();
    const filters = forumStore((state) => state.filters);
    const setFilters = forumStore((state) => state.setFilters);
    const handleSearchChange = (query: string) => {
        console.debug('handleSearchChange', query);
        setFilters({ company: query || undefined, page: 1, limit: 12 });
    };
    const { isLoading, isError } = useFetchForum();

    function createMockForums(count: number): Forum[] {
        const topCompanies = [
            'Apple',
            'Microsoft',
            'Amazon',
            'Alphabet',
            'NVIDIA',
            'Meta Platforms',
            'Berkshire Hathaway',
            'Johnson & Johnson',
            'Visa',
            'Procter & Gamble',
            'UnitedHealth Group',
            'JPMorgan Chase',
            'Exxon Mobil',
            'Home Depot',
            'Mastercard',
        ];

        return Array.from({ length: count }, (_, i) => {
            const index = i + 1;
            const randomName = topCompanies[i];

            return {
                _id: `forum-${index}`,
                company: {
                    _id: `company-${index}`,
                    name: randomName,
                    siretNumber: (10000000000000 + index).toString(),
                    nafCode: `NAF${100 + index}`,
                    structureType: 'SARL',
                    legalStatus: 'Active',
                    streetNumber: String(1 + i),
                    streetName: `Rue Exemple ${index}`,
                    postalCode: `7500${index % 10}`,
                    city: 'Paris',
                    country: 'France',
                    logo: `https://picsum.photos/seed/${encodeURIComponent(randomName)}/64`,
                    location: { lat: 48.8566 + i * 0.001, lng: 2.3522 + i * 0.001 },
                },
                nbTopics: Math.floor(Math.random() * 10000),
                nbMessages: Math.floor(Math.random() * 10000000),
            };
        });
    }

    function createMockTopics(count: number) {
        return Array.from({ length: count }, (_, i) => {
            const index = i + 1;
            return {
                _id: `topic-${index}`,
                title: `Sujet exemple ${index}`,
                description: `Qualisque fabulas mentitum cras netus duis habitant mazim posidonium eu convenire vocibus tation nulla efficiantur repudiandae nulla utinam morbi sollicitudin qualisque quas molestie curabitur torquent curabitur nibh delicata pertinax posse lacus dicant mediocrem ac quam sociis dictumst ad vestibulum invenire class doming velit sociosqu fabulas consetetur noster reque est suas labores ignota verterem recteque errem nibh tellus platea blandit ut quot numquam litora potenti dictas cubilia efficiantur discere augue tale feugait assueverit liber nullam veri viverra affert nunc tamquam populo constituam quod liber petentium assueverit vestibulum eloquentiam dolores tractatos litora ad mus numquam fabulas indoctum dolorem leo tota noster euismod reprimique harum senserit mea viverra petentium epicuri rutrum habitasse pri pro repudiare pericula consul doming causae sagittis dicta delicata`,
                author: {
                    _id: `user-${index}`,
                    firstName: `Prénom${index}`,
                    lastName: `Nom${index}`,
                },
                nbMessages: Math.floor(Math.random() * 5000),
            };
        });
    }

    // const forums: Forum[] = createMockForums(12);
    const forums: Forum[] = forumStore((state) => state.forums);

    useEffect(() => {
        console.log('Forums loaded:', forums);
    }, [forums]);

    const generalForum: Forum = {
        _id: 'forum-general',
        topics: createMockTopics(5),
        nbTopics: 5000,
        nbMessages: 200000,
    };

    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={false} />
            <Spinner show={navigation.state === 'loading' || isLoading} />
            {!isLoading && !isError && (
                <div className="flex flex-col justify-center gap-8 p-8">
                    <div className="flex flex-col items-center">
                        <div className="flex w-fit text-4xl font-bold">Forums</div>
                        <div className="flex w-fit">Échangez, posez vos questions et partagez vos expériences.</div>
                    </div>

                    <div>
                        <div className="card bg-base-100 shadow-sm shadow-base-300 hover:shadow-md hover:bg-base-200 transition-all duration-100 ease-out cursor-pointer">
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
                        </div>

                        <table className="table max-w-full">
                            <tbody>
                                {generalForum.topics?.map((topic) => (
                                    <TopicHeader topic={topic} key={topic._id} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="w-full flex flex-col gap-2 justify-center">
                        <SearchBar
                            searchQuery={filters.company || ''}
                            setSearchQuery={handleSearchChange}
                            selects={[]}
                            placeholder="Rechercher par entreprise ..."
                        />

                        <ul className="w-full space-y-2 flex flex-wrap justify-between">
                            {forums.map((f) => (
                                <ForumHeader forum={f} key={f._id} />
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
