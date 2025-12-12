import { useState, useEffect } from 'react';
import { ChevronUp, Eye } from 'lucide-react';
import { PdfModal } from './PdfModal.tsx';
import { usePublicSignedUrl } from '../../../../hooks/useBlob.tsx';
import { ApplicationPagination } from './ApplicationPagination.tsx';
import type { Application, ApplicationFilters, ApplicationStatus } from '../../../../types/application.types.ts';
import { useQuery } from '@tanstack/react-query';
import type { PaginationResult } from '../../../../types/internship.types.ts';
import { useParams } from 'react-router';

interface Props {
    status: ApplicationStatus;
    title: string;
    activeTab: ApplicationStatus | null;
    setActiveTab: (tab: ApplicationStatus | null) => void;
}

export const ApplicationTable = ({ status, title, activeTab, setActiveTab }: Props) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [filters, setFilters] = useState<ApplicationFilters>({ page: 1, limit: 5 });
    const postId = useParams().postId as string;

    const mockApplications = [
        {
            _id: '648a4b2f9d3e2a1b5c8f1a01',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p01',
                title: 'Développeur React Junior',
                description: 'CDI - Paris',
                tags: ['React', 'TypeScript'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s01',
                firstName: 'Alice',
                lastName: 'Dupont',
                email: 'alice.dupont@example.com',
            } as any,
            status: 'PENDING' as any,
            cv: '6934738e16bc97b5e972cfde_cv.pdf',
            coverLetter: 'uploads/cl/alice-dupont.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a02',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p02',
                title: 'Stage Backend Node.js',
                description: 'Stage 6 mois - Lyon',
                tags: ['Node.js', 'NestJS'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s02',
                firstName: 'Bob',
                lastName: 'Marley',
                email: 'bob.marley@example.com',
            } as any,
            status: 'REJECTED' as any,
            cv: 'uploads/cv/bob-marley.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a03',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p03',
                title: 'Data Scientist Senior',
                description: 'CDI - Remote',
                tags: ['Python', 'TensorFlow', 'Pandas'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s03',
                firstName: 'Charlie',
                lastName: 'Chaplin',
                email: 'charlie.chaplin@example.com',
            } as any,
            status: 'ACCEPTED' as any,
            cv: 'uploads/cv/charlie-chaplin.pdf',
            coverLetter: 'uploads/cl/charlie-chaplin.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a04',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p04',
                title: 'Alternance DevOps',
                description: 'Alternance 1 an - Bordeaux',
                tags: ['Docker', 'Kubernetes', 'AWS'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s04',
                firstName: 'David',
                lastName: 'Bowie',
                email: 'david.bowie@example.com',
            } as any,
            status: 'REVIEWING' as any,
            cv: 'uploads/cv/david-bowie.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a05',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p05',
                title: 'UX/UI Designer',
                description: 'Freelance - Paris',
                tags: ['Figma', 'Adobe XD', 'Sketch'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s05',
                firstName: 'Eva',
                lastName: 'Green',
                email: 'eva.green@example.com',
            } as any,
            status: 'PENDING' as any,
            cv: '6934738e16bc97b5e972cfde_cv.pdf',
            coverLetter: 'uploads/cl/eva-green.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a06',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p06',
                title: 'Développeur Fullstack PHP',
                description: 'CDI - Lille',
                tags: ['Symfony', 'Vue.js', 'MySQL'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s06',
                firstName: 'Fabien',
                lastName: 'Barthez',
                email: 'fabien.barthez@example.com',
            } as any,
            status: 'REJECTED' as any,
            cv: 'uploads/cv/fabien-barthez.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a07',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p07',
                title: 'Ingénieur Machine Learning',
                description: 'CDI - Sophia Antipolis',
                tags: ['PyTorch', 'C++', 'AI'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s07',
                firstName: 'Grace',
                lastName: 'Hopper',
                email: 'grace.hopper@example.com',
            } as any,
            status: 'ACCEPTED' as any,
            cv: 'uploads/cv/grace-hopper.pdf',
            coverLetter: 'uploads/cl/grace-hopper.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a08',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p08',
                title: 'Développeur Mobile iOS',
                description: 'CDI - Nantes',
                tags: ['Swift', 'SwiftUI', 'Objective-C'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s08',
                firstName: 'Hugo',
                lastName: 'Lloris',
                email: 'hugo.lloris@example.com',
            } as any,
            status: 'PENDING' as any,
            cv: 'uploads/cv/hugo-lloris.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a09',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p09',
                title: 'Product Owner',
                description: 'CDD 12 mois - Marseille',
                tags: ['Agile', 'Scrum', 'Jira'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s09',
                firstName: 'Ines',
                lastName: 'Reg',
                email: 'ines.reg@example.com',
            } as any,
            status: 'REVIEWING' as any,
            cv: 'uploads/cv/ines-reg.pdf',
            coverLetter: 'uploads/cl/ines-reg.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a10',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p10',
                title: 'Développeur Android',
                description: "Stage Fin d'études - Paris",
                tags: ['Kotlin', 'Java', 'Android SDK'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s10',
                firstName: 'Jean',
                lastName: 'Dujardin',
                email: 'jean.dujardin@example.com',
            } as any,
            status: 'PENDING' as any,
            cv: 'uploads/cv/jean-dujardin.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a11',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p11',
                title: 'Lead Developer Java',
                description: 'CDI - Strasbourg',
                tags: ['Java', 'Spring Boot', 'Hibernate'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s11',
                firstName: 'Kylian',
                lastName: 'Mbappe',
                email: 'kylian.mbappe@example.com',
            } as any,
            status: 'REJECTED' as any,
            cv: 'uploads/cv/kylian-mbappe.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a12',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p12',
                title: 'Consultant Cybersécurité',
                description: 'CDI - La Défense',
                tags: ['Pentest', 'Python', 'Security'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s12',
                firstName: 'Lea',
                lastName: 'Seydoux',
                email: 'lea.seydoux@example.com',
            } as any,
            status: 'ACCEPTED' as any,
            cv: 'uploads/cv/lea-seydoux.pdf',
            coverLetter: 'uploads/cl/lea-seydoux.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a13',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p13',
                title: 'Développeur Front-End Angular',
                description: 'Freelance - Remote',
                tags: ['Angular', 'RxJS', 'TypeScript'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s13',
                firstName: 'Moussa',
                lastName: 'Sissoko',
                email: 'moussa.sissoko@example.com',
            } as any,
            status: 'PENDING' as any,
            cv: 'uploads/cv/moussa-sissoko.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a14',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p14',
                title: 'Data Analyst',
                description: 'Stage 4 mois - Toulouse',
                tags: ['SQL', 'Tableau', 'PowerBI'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s14',
                firstName: 'Nina',
                lastName: 'Simone',
                email: 'nina.simone@example.com',
            } as any,
            status: 'REVIEWING' as any,
            cv: 'uploads/cv/nina-simone.pdf',
            coverLetter: 'uploads/cl/nina-simone.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a15',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p15',
                title: 'Administrateur Système',
                description: 'Alternance - Rennes',
                tags: ['Linux', 'Bash', 'Ansible'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s15',
                firstName: 'Omar',
                lastName: 'Sy',
                email: 'omar.sy@example.com',
            } as any,
            status: 'PENDING' as any,
            cv: 'uploads/cv/omar-sy.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a16',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p16',
                title: 'QA Automation Engineer',
                description: 'CDI - Bordeaux',
                tags: ['Selenium', 'Cypress', 'JavaScript'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s16',
                firstName: 'Penelope',
                lastName: 'Cruz',
                email: 'penelope.cruz@example.com',
            } as any,
            status: 'REJECTED' as any,
            cv: 'uploads/cv/penelope-cruz.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a17',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p17',
                title: 'Développeur Ruby on Rails',
                description: 'CDI - Paris',
                tags: ['Ruby', 'Rails', 'PostgreSQL'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s17',
                firstName: 'Quentin',
                lastName: 'Tarantino',
                email: 'quentin.tarantino@example.com',
            } as any,
            status: 'PENDING' as any,
            cv: 'uploads/cv/quentin-tarantino.pdf',
            coverLetter: 'uploads/cl/quentin-tarantino.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a18',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p18',
                title: 'Tech Lead C# .NET',
                description: 'CDI - Lyon',
                tags: ['C#', '.NET Core', 'Azure'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s18',
                firstName: 'Rihanna',
                lastName: 'Fenty',
                email: 'rihanna.fenty@example.com',
            } as any,
            status: 'REVIEWING' as any,
            cv: 'uploads/cv/rihanna-fenty.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a19',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p19',
                title: 'Développeur Rust',
                description: 'Freelance - Remote',
                tags: ['Rust', 'WebAssembly', 'Tokio'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s19',
                firstName: 'Sophie',
                lastName: 'Marceau',
                email: 'sophie.marceau@example.com',
            } as any,
            status: 'ACCEPTED' as any,
            cv: 'uploads/cv/sophie-marceau.pdf',
            coverLetter: 'uploads/cl/sophie-marceau.pdf',
        },
        {
            _id: '648a4b2f9d3e2a1b5c8f1a20',
            post: {
                _id: '648a4b2f9d3e2a1b5c8f1p20',
                title: 'Ingénieur Cloud GCP',
                description: 'CDI - Paris',
                tags: ['GCP', 'Terraform', 'Python'],
            } as any,
            student: {
                _id: '648a4b2f9d3e2a1b5c8f1s20',
                firstName: 'Tony',
                lastName: 'Parker',
                email: 'tony.parker@example.com',
            } as any,
            status: 'PENDING' as any,
            cv: 'uploads/cv/tony-parker.pdf',
        },
    ];

    function toPage(): PaginationResult<Application> {
        const temp = mockApplications
            .filter((app) => app.status === status)
            .slice((filters.page - 1) * filters.limit, filters.page * filters.limit);

        return {
            hasNext: filters.page * filters.limit < mockApplications.filter((app) => app.status === status).length,
            hasPrev: filters.page > 1,
            data: temp,
            page: filters.page,
            limit: filters.limit,
            totalPages: Math.ceil(mockApplications.filter((app) => app.status === status).length / filters.limit),
            total: mockApplications.filter((app) => app.status === status).length,
        };
    }

    // Use React Query to fetch applications with current filters
    const { data: applicationsData, isLoading } = useQuery<PaginationResult<Application>, Error>({
        queryKey: ['applications', filters],

        queryFn: async () => {
            // const params = buildQueryParams(filters);
            return toPage();
            // return await fetchApplications(postId, params, status);
        },

        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // Use React Query to fetch and cache the signed URL
    const { data: signedUrl, isError: pubUrlIsError } = usePublicSignedUrl(selectedFile);

    /**
     * Handle page change for pagination
     * @param newPage - The new page number to navigate to
     */
    function handlePageChange(newPage: number) {
        const maxPage = applicationsData?.totalPages ?? newPage;
        const target = Math.max(1, Math.min(newPage, maxPage));
        if (filters.page === target) return;
        setFilters((prev) => ({ ...prev, page: target }));
    }

    /**
     * Preview PDF file in modal
     * Sets the selected file name which triggers the useQuery hook
     * @param fileName - The fileName of the PDF to preview
     */
    function previewPdf(fileName: string) {
        setSelectedFile(fileName);
    }

    function handleClickTable() {
        console.log(activeTab);
        setActiveTab(activeTab === status ? null : status);
    }

    useEffect(() => {
        if (signedUrl && selectedFile) {
            setPreviewUrl(signedUrl);
        } else if (pubUrlIsError && selectedFile) {
            console.error("Erreur lors de la récupération de l'URL signée:", selectedFile);
        }
    }, [signedUrl, selectedFile, pubUrlIsError]);

    return (
        <div
            className={`card bg-base-100 shadow-xl shadow-base-300 overflow-hidden m-1 p-3 transition-[flex] duration-500 ease-in-out ${
                activeTab === status ? 'flex-1 min-h-0' : 'flex-none'
            }`}
        >
            <>
                <div className="flex-none p-4 border-base-200 z-20 bg-base-100 flex justify-between items-center">
                    <div className="card-title text-lg select-none">
                        {title}
                        {applicationsData?.data && applicationsData.data.length > 0 && (
                            <span className="badge badge-sm badge-ghost ml-2 font-normal">
                                {applicationsData.data.length}
                            </span>
                        )}
                    </div>

                    <div className={`${!(activeTab === status) ? 'hidden' : ''}`}>
                        {applicationsData?.data && (
                            <ApplicationPagination pagination={applicationsData} handlePageChange={handlePageChange} />
                        )}
                    </div>

                    <div onClick={() => handleClickTable()} className="btn btn-square btn-ghost cursor-pointer">
                        <ChevronUp
                            strokeWidth={2}
                            stroke="currentColor"
                            className={`w-5 h-5 transition-transform duration-300 ease-out ${activeTab === status ? 'rotate-0' : 'rotate-180'}`}
                        />
                    </div>
                </div>
                {isLoading || !applicationsData ? (
                    <div className={`flex justify-center items-center flex-1 ${!(activeTab === status) && 'hidden'}`}>
                        <span className="loading loading-spinner loading-xl"></span>
                    </div>
                ) : (
                    <div
                        className={`flex-1 overflow-y-auto min-h-0 bg-base-100 ${!(activeTab === status) && 'hidden'}`}
                    >
                        <table className="table table-pin-rows table-zebra">
                            <thead>
                                <tr className="bg-base-100">
                                    <th>Prénom</th>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th className="w-px whitespace-nowrap text-center">CV</th>
                                    <th className="w-px whitespace-nowrap text-center">Lettre de motivation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applicationsData.data.map((mockedApplication: any) => (
                                    <tr
                                        key={mockedApplication._id}
                                        className="hover:bg-base-300 duration-300 ease-out transition-color"
                                    >
                                        <td>{mockedApplication.student.firstName}</td>
                                        <td>{mockedApplication.student.lastName}</td>
                                        <td>{mockedApplication.student.email}</td>
                                        <td className="whitespace-nowrap text-center">
                                            {mockedApplication.cv && (
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => previewPdf(mockedApplication.cv)}
                                                >
                                                    <Eye strokeWidth={2} />
                                                </button>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap text-center">
                                            {mockedApplication.coverLetter && (
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => previewPdf(mockedApplication.coverLetter)}
                                                >
                                                    <Eye strokeWidth={2} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {applicationsData.data.length === 0 && (
                            <div className="flex justify-center items-center h-20 text-base-content/50 italic">
                                Aucune candidature
                            </div>
                        )}
                    </div>
                )}

                {previewUrl && (
                    <PdfModal
                        url={previewUrl}
                        onClose={() => {
                            setPreviewUrl(null);
                            setSelectedFile(null);
                        }}
                    />
                )}
            </>
        </div>
    );
};
