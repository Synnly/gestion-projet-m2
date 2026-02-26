import { useNavigation } from 'react-router';
import { useInternshipStore } from '../../stores/useInternshipStore';
import { userStore } from '../../stores/userStore';
import { FilterList } from '../common/filter/FilterList';
import { SearchBar } from '../../pages/common/inputs/searchBar/SearchBar';
import { Navbar } from '../common/navbar/Navbar';
import Spinner from '../common/Spinner/Spinner';
import ToastProvider from '../common/ui/toast/ToastProvider';
import InternshipDetail from './components/InternshipDetail';
import InternshipList from './components/InternshipList';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export function InternshipPage() {
    const navigation = useNavigation();
    const internships = useInternshipStore((state) => state.internships);
    const selectedInternshipId = useInternshipStore((state) => state.selectedInternshipId);
    const filters = useInternshipStore((state) => state.filters);
    const setFilters = useInternshipStore((state) => state.setFilters);

    const selectedInternship = internships.find((j) => j._id === selectedInternshipId) ?? null;

    const handleSearchChange = (query: string) => {
        setFilters({ searchQuery: query || undefined, page: 1 });
    };

    const access = userStore((s) => s.access);

    // Vérifier si un message d'import réussi existe dans le localStorage
    useEffect(() => {
        const importMessage = localStorage.getItem('import_success_message');
        if (importMessage) {
            toast.info(importMessage, { autoClose: 5000 });
            localStorage.removeItem('import_success_message');
        }
    }, []);
    useEffect(() => {});
    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={!access} />
            <Spinner show={navigation.state === 'loading'} />
            <main className="flex-1 w-full flex justify-center overflow-hidden">
                <div className="w-full flex-1 px-4 md:px-8 flex flex-col">
                    <section className="hero bg-base-100 p-6 rounded-lg py-8">
                        <div className="hero-content text-left">
                            <div>
                                <h1 className="text-lg font-black tracking-tight text-base-content uppercase text-center">
                                    Trouve ta prochaine opportunité
                                </h1>
                                <p className="mt-1 text-sm text-base-content/70">
                                    Parcours des milliers de stages proposés par les meilleures entreprises.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col gap-1">
                        <SearchBar
                            searchQuery={filters.searchQuery || ''}
                            setSearchQuery={handleSearchChange}
                            selects={[]}
                        />
                        <div className="flex items-center justify-between">
                            <FilterList />
                        </div>
                    </div>
                    <div className="flex gap-4 pb-2 flex-1 overflow-hidden">
                        <div className="flex flex-col col-span-12 lg:col-span-5 h-full overflow-hidden">
                            <ToastProvider>
                                <InternshipList />
                            </ToastProvider>
                        </div>

                        {selectedInternship ? (
                            <div className="flex flex-1 h-full overflow-y-auto">
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
