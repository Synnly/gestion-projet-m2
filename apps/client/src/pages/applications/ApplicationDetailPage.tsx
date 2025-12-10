import { Navbar } from '../../components/navbar/Navbar';
import { Link, useParams } from 'react-router-dom';

const statusStyles: Record<
    'Applied' | 'Under Review' | 'Interviewing' | 'Offer' | 'Rejected',
    string
> = {
    Applied: 'badge badge-sm bg-blue-100 text-blue-700 border-blue-200',
    'Under Review': 'badge badge-sm bg-pink-100 text-pink-700 border-pink-200',
    Interviewing: 'badge badge-sm bg-yellow-100 text-yellow-700 border-yellow-200',
    Offer: 'badge badge-sm bg-green-100 text-green-700 border-green-200',
    Rejected: 'badge badge-sm bg-red-100 text-red-700 border-red-200',
};

// Données statiques de démonstration
const mockApplication = {
    id: '1',
    status: 'Applied' as const,
    dateApplied: 'August 15, 2024',
    cvFile: 'cv_toto.pdf',
    lmFile: 'lm_toto.pdf',
    post: {
        title: 'Software Engineer Intern',
        track: 'Engineering • Summer 2024',
        company: 'Google',
        location: 'Paris, France',
        type: 'Full-time',
        duration: '6 months',
        description:
            'Collaborate with senior engineers to build scalable web services. Work with TypeScript, React, and Node.js on real-world projects.',
        skills: ['TypeScript', 'React', 'Node.js', 'REST APIs'],
    },
};

export default function ApplicationDetailPage() {
    const { applicationId } = useParams();
    const application = mockApplication; // Remplacer par un fetch /api/application/:id plus tard

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />
            <main className="w-full flex justify-center px-4 md:px-8 py-8">
                <div className="w-full max-w-5xl space-y-6">
                    <div className="breadcrumbs text-sm text-base-content/60">
                        <ul>
                            <li>
                                <Link to="/">Home</Link>
                            </li>
                            <li>
                                <Link to="/applications">My Applications</Link>
                            </li>
                            <li>Application {applicationId}</li>
                        </ul>
                    </div>

                    <header className="bg-base-100 rounded-xl shadow-sm p-6 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-base-content">{application.post.title}</h1>
                                <p className="text-sm text-base-content/70">{application.post.track}</p>
                                <p className="text-sm text-base-content/80 mt-1">{application.post.company}</p>
                                <p className="text-sm text-base-content/60">{application.post.location}</p>
                            </div>
                            <span className={statusStyles[application.status]}>{application.status}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-base-content/70">
                            <div>
                                <span className="font-semibold text-base-content">Date applied:</span>{' '}
                                {application.dateApplied}
                            </div>
                            <div>
                                <span className="font-semibold text-base-content">Type:</span> {application.post.type}
                            </div>
                            <div>
                                <span className="font-semibold text-base-content">Duration:</span>{' '}
                                {application.post.duration}
                            </div>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="card bg-base-100 shadow-sm">
                                <div className="card-body space-y-2">
                                    <h2 className="card-title text-base-content">Role description</h2>
                                    <p className="text-sm text-base-content/80 leading-relaxed">
                                        {application.post.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {application.post.skills.map((skill) => (
                                            <span key={skill} className="badge badge-outline">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="card bg-base-100 shadow-sm">
                                <div className="card-body space-y-3">
                                    <h2 className="card-title text-base-content text-lg">Documents</h2>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-base-content/80">CV</span>
                                        <button className="btn btn-ghost btn-xs" disabled>
                                            {application.cvFile} (soon)
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-base-content/80">Cover Letter</span>
                                        <button className="btn btn-ghost btn-xs" disabled>
                                            {application.lmFile} (soon)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-100 shadow-sm">
                                <div className="card-body space-y-3">
                                    <h2 className="card-title text-base-content text-lg">Actions</h2>
                                    <button className="btn btn-primary btn-sm w-full" disabled>
                                        Download CV
                                    </button>
                                    <button className="btn btn-outline btn-sm w-full" disabled>
                                        Download Cover Letter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
