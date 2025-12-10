import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { fetchInternshipById } from '../../../hooks/useFetchInternships.ts';
import { ApplicationTable } from './component/ApplicationTable.tsx';

export const ApplicationList = () => {
    const internshipId = useParams().postId as string;
    const query = useQuery({
        queryKey: ['internship', internshipId],
        queryFn: () => fetchInternshipById(internshipId),
        enabled: true,
    });

    const mockedApplications = [
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
            cv: 'uploads/cv/alice-dupont.pdf',
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
            status: 'INTERVIEWING' as any,
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
            cv: 'uploads/cv/eva-green.pdf',
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
            status: 'INTERVIEWING' as any,
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
            status: 'INTERVIEWING' as any,
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
            status: 'INTERVIEWING' as any,
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

    const rejected = mockedApplications.filter((a) => a.status === 'REJECTED');
    const accepted = mockedApplications.filter((a) => a.status === 'ACCEPTED');
    const pending = mockedApplications.filter((a) => a.status === 'PENDING');

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {!query.isLoading && (
                <div className="flex flex-col h-full">
                    <div className="flex-none flex justify-between p-4">
                        <div className="flex flex-row gap-2">
                            <div className="font-bold">Titre</div>
                            <div>{query.data?.title}</div>
                        </div>
                        {query.data?.keySkills && query.data?.keySkills.length > 0 && (
                            <div className="flex gap-5">
                                <h5 className="font-bold text-base-content">Compétences</h5>
                                <div className="flex flex-wrap gap-2">
                                    {query.data?.keySkills.map((skill, index) => (
                                        <span key={index} className="badge badge-outline">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {query.data?.startDate && (
                            <div className="flex gap-5">
                                <h5 className="font-bold text-base-content">Date de début</h5>
                                <p>{new Date(query.data?.startDate).toLocaleDateString('fr-FR')}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col gap-6 p-6 pt-0 min-h-0 overflow-hidden">
                        <div className="flex-1 min-h-0">
                            <ApplicationTable mockedApplications={pending} title="Candidatures en attente" />
                        </div>
                        <div className="flex-1 min-h-0">
                            <ApplicationTable mockedApplications={accepted} title="Candidatures acceptées" />
                        </div>
                        <div className="flex-1 min-h-0">
                            <ApplicationTable mockedApplications={rejected} title="Candidatures refusées" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
