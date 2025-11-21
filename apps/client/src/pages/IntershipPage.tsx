import { SearchBar } from '../components/inputs/searchBar';
import { mockJobs } from '../modules/intershipList/data';
import InternshipList from '../modules/intershipList/InternshipList';
import InternshipDetail from '../modules/intershipList/InternshipDetail';
import { useJobStore } from '../store/internShipStore';
import Header from '../components/layout/Header';

export function InternshipPage() {
    const selects = [
        { label: 'Location', options: ['Remote', 'On-site', 'Hybrid'] },
        { label: 'Job Type', options: ['Full-time', 'Part-time', 'Contract'] },
        { label: 'Industry', options: ['Tech', 'Finance', 'Healthcare'] },
        { label: 'Date Posted', options: ['Last 24 hours', 'Last 7 days', 'Last 30 days'] },
    ];

    const internshipsList = mockJobs;
    const { searchQuery, setSearchQuery, selectedJobId } = useJobStore();

    const selected = internshipsList.find((j) => j.id === selectedJobId) ?? null;

    return (
        <div className="p-8">
            <Header />
            <main className="flex w-full flex-1 justify-center">
                <div className="w-full flex-1 px-4 md:px-8">
                    <div className="py-8">
                        <h1 className="text-4xl font-black tracking-tight text-base-content">
                            Find Your Next Opportunity
                        </h1>
                        <p className="mt-2 text-base text-base-content/70">
                            Browse thousands of internships and full-time jobs from top companies.
                        </p>
                    </div>

                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} selects={selects} />

                    <div className="grid grid-cols-12 gap-8 pb-8">
                        <InternshipList internships={internshipsList} />
                        {selected ? (
                            <InternshipDetail internship={selected} />
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
