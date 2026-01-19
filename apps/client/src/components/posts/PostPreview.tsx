import { useCreatePostStore } from '../../store/CreatePostStore';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-markdown-preview/markdown.css';
import type { CompanyInInternship } from '../../types/internship.types.ts';
import { fetchPublicSignedUrl } from '../../hooks/useBlob.tsx';
import { useEffect, useState } from 'react';

type PostPreviewProps = {
    company: CompanyInInternship;
};

export function PostPreview({ company }: PostPreviewProps) {
    const [logoUrl, setLogoUrl] = useState<string | undefined>(company.logoUrl);
    const {
        title,
        description,
        adress,
        duration,
        sector,
        startDate,
        minSalary,
        maxSalary,
        skills: keySkills,
        type,
    } = useCreatePostStore();

    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return null;
        if (min && max) return `${min}€ - ${max}€`;
        if (min) return `À partir de ${min}€`;
        if (max) return `Jusqu'à ${max}€`;
        return null;
    };

    const salary = formatSalary(minSalary, maxSalary);

    useEffect(() => {
        if (company.logo) {
            fetchPublicSignedUrl(company.logo).then((r) => {
                if (r) setLogoUrl(r);
            });
        }
    }, [company.logoUrl]);

    return (
        <div className="flex flex-col flex-1">
            <div className="card bg-base-100 rounded-xl">
                <div className="card-body p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="avatar flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-300">
                                {logoUrl ? (
                                    <img alt={`${company.name} logo`} className="rounded" src={logoUrl} />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-base-content">
                                        {company.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-base-content">{title}</h3>
                                <p className="mt-1 text-base-content">
                                    {company.name} • {adress}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span className="badge badge-primary text-content-primary">{type}</span>
                                    {sector && <span className="badge">{sector}</span>}
                                    {duration && <span className="badge">{duration}</span>}
                                    {salary && <span className="badge badge-accent">{salary}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-base-300! pt-6">
                        <h4 className="text-lg font-bold">Description du stage</h4>
                        <div className="mt-4 space-y-4 text-sm text-base-content">
                            <div className="prose max-w-none bg-transparent text-base-content shadow-none border-0">
                                <MDEditor.Markdown
                                    source={description ?? ''}
                                    className="bg-transparent! text-base-content!"
                                />
                            </div>

                            {keySkills && keySkills.length > 0 && (
                                <>
                                    <h5 className="font-bold text-base-content">Compétences clés</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {keySkills.map((skill, index) => (
                                            <span key={index} className="badge badge-outline">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}

                            {startDate && (
                                <>
                                    <h5 className="font-bold text-base-content">Date de début</h5>
                                    <p>{new Date(startDate).toLocaleDateString('fr-FR')}</p>
                                </>
                            )}

                            <div className="mt-6">
                                <h5 className="font-bold text-base-content">À propos de l'entreprise</h5>
                                <p className="mt-2">{company.name}</p>
                                {company.email && (
                                    <p className="mt-1 text-sm text-base-content/70">Contact: {company.email}</p>
                                )}
                                {company.address && (
                                    <p className="mt-1 text-sm text-base-content/70">{company.address}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
