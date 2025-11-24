import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useInternshipStore } from '../../store/useInternshipStore';
import type { Internship } from '../../types/internship.types';
import { Bookmark, ArrowUpRight, Share2 } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

const InternshipDetail: React.FC<{ internship: Internship }> = ({ internship }) => {
    const savedInternships = useInternshipStore((state) => state.savedInternships);
    const toggleSaveInternship = useInternshipStore((state) => state.toggleSaveInternship);
    const setDetailHeight = useInternshipStore((s) => s.setDetailHeight);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const isSaved = savedInternships.includes(internship._id);

    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return null;
        if (min && max) return `${min}€ - ${max}€`;
        if (min) return `À partir de ${min}€`;
        if (max) return `Jusqu'à ${max}€`;
        return null;
    };

    const salary = formatSalary(internship.minSalary, internship.maxSalary);

    useEffect(() => {
        const update = () => {
            const el = rootRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const detailHeight = Math.ceil(rect.height);
            const winH = window.innerHeight;
            if (detailHeight <= winH) {
                setDetailHeight(detailHeight);
            } else {
                setDetailHeight(null);
            }
        };

        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [setDetailHeight]);

    const navigate = useNavigate();

    const handleApply = () => {
        navigate(`/internship/detail/${internship._id}`);
    };

    return (
        <div className="col-span-12 lg:col-span-7">
            <div ref={rootRef}>
                <div className="card bg-base-100 rounded-xl">
                    <div className="card-body p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-300">
                                    {internship.company.logoUrl ? (
                                        <img
                                            alt={`${internship.company.name} logo`}
                                            className="h-9 w-9"
                                            src={internship.company.logoUrl}
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-base-content">
                                            {internship.company.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-base-content">{internship.title}</h3>
                                    <p className="mt-1 text-base-content">
                                        {internship.company.name} • {internship.address}
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="badge badge-success text-base-content">{internship.type}</span>
                                        {internship.sector && <span className="badge">{internship.sector}</span>}
                                        {internship.duration && <span className="badge">{internship.duration}</span>}
                                        {salary && <span className="badge badge-accent">{salary}</span>}
                                    </div>
                                </div>
                            </div>
                            <button className="text-primary" onClick={() => toggleSaveInternship(internship._id)}>
                                <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={handleApply}
                                className="btn btn-primary flex h-11 flex-1 items-center justify-center gap-2"
                            >
                                <ArrowUpRight size={20} />
                                <span>Apply Now</span>
                            </button>
                            <button className="btn btn-ghost flex h-11 items-center justify-center gap-2">
                                <Share2 size={20} />
                                <span>Share</span>
                            </button>
                        </div>

                        <div className="mt-8 border-t border-base-300! pt-6">
                            <h4 className="text-lg font-bold">Description du stage</h4>
                            <div className="mt-4 space-y-4 text-sm text-base-content">
                                <div className="prose max-w-none bg-transparent text-base-content shadow-none border-0">
                                    <MDEditor.Markdown
                                        source={internship.description ?? ''}
                                        className="bg-transparent! text-neutral!"
                                    />
                                </div>

                                {internship.keySkills && internship.keySkills.length > 0 && (
                                    <>
                                        <h5 className="font-bold text-base-content">Compétences clés</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {internship.keySkills.map((skill, index) => (
                                                <span key={index} className="badge badge-outline">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {internship.startDate && (
                                    <>
                                        <h5 className="font-bold text-base-content">Date de début</h5>
                                        <p>{new Date(internship.startDate).toLocaleDateString('fr-FR')}</p>
                                    </>
                                )}

                                <div className="mt-6">
                                    <h5 className="font-bold text-base-content">À propos de l'entreprise</h5>
                                    <p className="mt-2">{internship.company.name}</p>
                                    {internship.company.email && (
                                        <p className="mt-1 text-sm text-base-content/70">
                                            Contact: {internship.company.email}
                                        </p>
                                    )}
                                    {internship.company.city && internship.company.country && (
                                        <p className="mt-1 text-sm text-base-content/70">
                                            {internship.company.city}, {internship.company.country}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternshipDetail;
