import { SearchBar } from '../components/inputs/searchBar';
import InternshipList from '../modules/intershipList/InternshipList';
import InternshipDetail from '../modules/intershipList/InternshipDetail';
import Header from '../components/layout/Header';
import { useInternShipStore } from '../store/useInternShipStore';

export function InternshipPage() {
    const selects = [
        { label: 'Location', options: ['Remote', 'On-site', 'Hybrid'] },
        { label: 'Job Type', options: ['Full-time', 'Part-time', 'Contract'] },
        { label: 'Industry', options: ['Tech', 'Finance', 'Healthcare'] },
        { label: 'Date Posted', options: ['Last 24 hours', 'Last 7 days', 'Last 30 days'] },
    ];

    const internships = useInternShipStore((state) => state.internships);
    const selectedInternshipId = useInternShipStore((state) => state.selectedInternshipId);
    const filters = useInternShipStore((state) => state.filters);
    const setFilters = useInternShipStore((state) => state.setFilters);

    const selectedInternship = internships.find((j) => j._id === selectedInternshipId) ?? null;

    const handleSearchChange = (query: string) => {
        setFilters({ searchQuery: query || undefined, page: 1 });
    };

    return (
        <div className="px-8">
            <Header />
            <main className="flex w-full flex-1 justify-center">
                <div className="w-full flex-1 px-4 md:px-8">
                    <section className="hero bg-base-100 p-6 rounded-lg py-8">
                        <div className="hero-content text-left">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-base-content">
                                    Find Your Next Opportunity
                                </h1>
                                <p className="mt-2 text-base text-base-content/70">
                                    Browse thousands of internships and full-time jobs from top companies.
                                </p>
                            </div>
                        </div>
                    </section>

                    <SearchBar
                        searchQuery={filters.searchQuery || ''}
                        setSearchQuery={handleSearchChange}
                        selects={selects}
                    />

                    <div className="grid grid-cols-12 gap-8 pb-8">
                        <InternshipList />
                        {selectedInternship ? (
                            <InternshipDetail internship={selectedInternship} />
                        ) : (
                            <div className="col-span-12 lg:col-span-7 flex items-center justify-center text-base-content/60">
                                Select an internship to see details
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
