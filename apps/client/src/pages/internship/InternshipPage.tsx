import { SearchBar } from '../../components/inputs/searchBar';
import InternshipList from '../../modules/internship/InternshipList';
import InternshipDetail from '../../modules/internship/InternshipDetail';
import { useInternshipStore } from '../../store/useInternshipStore';
import { Navbar } from '../../components/navbar/Navbar';
import { userStore } from '../../store/userStore';
import { useNavigation } from 'react-router-dom';
import Spinner from '../../components/Spinner/Spinner';
import ToastProvider from '../../components/ui/toast/ToastProvider';

export function InternshipPage() {
    const navigation = useNavigation();
    const selects = [
        { label: 'Localisation', options: ['À distance', 'Sur site', 'Hybride'] },
        { label: 'Type de stage', options: ['Temps plein', 'Temps partiel', 'Contrat'] },
        { label: 'Secteur', options: ['Tech', 'Finance', 'Santé'] },
        { label: 'Date de publication', options: ['Moins de 24 heures', "Moins d'une semaine", 'Moins de 30 jours'] },
    ];
    const internships = useInternshipStore((state) => state.internships);
    const selectedInternshipId = useInternshipStore((state) => state.selectedInternshipId);
    const filters = useInternshipStore((state) => state.filters);
    const setFilters = useInternshipStore((state) => state.setFilters);

    const selectedInternship = internships.find((j) => j._id === selectedInternshipId) ?? null;

    const handleSearchChange = (query: string) => {
        setFilters({ searchQuery: query || undefined, page: 1 });
    };

    const access = userStore((s) => s.access);

    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={!access} />
            <Spinner show={navigation.state === 'loading'} />
            <main className="flex-1 w-full flex justify-center overflow-hidden">
                <div className="w-full flex-1 px-4 md:px-8 flex flex-col">
                    <section className="hero bg-base-100 p-6 rounded-lg py-8">
                        <div className="hero-content text-left">
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-base-content uppercase text-center">
                                    Trouve ta prochaine opportunité
                                </h1>
                                <p className="mt-2 text-base text-base-content/70">
                                    Parcours des milliers de stages proposés par les meilleures entreprises.
                                </p>
                            </div>
                        </div>
                    </section>

                    <SearchBar
                        searchQuery={filters.searchQuery || ''}
                        setSearchQuery={handleSearchChange}
                        selects={selects}
                    />
                    <div className="grid grid-cols-12 gap-8 pb-8 flex-1 overflow-hidden">
                        <div className="col-span-12 lg:col-span-5 h-full overflow-y-auto">
                            <InternshipList />
                        </div>

                        {selectedInternship ? (
                            <div className="col-span-12 lg:col-span-7 h-full overflow-y-auto">
                                <InternshipDetail internship={selectedInternship} />
                            </div>
                        ) : (
                            <div className="col-span-12 lg:col-span-7 h-full flex items-center justify-center text-base-content/60">
                                Select an internship to see details
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
