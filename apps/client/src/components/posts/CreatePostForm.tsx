import { type FormEvent, type KeyboardEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

import { createPost, type CreatePostPayload } from '../../api/create_post';
import { updatePost } from '../../api/update_post';
import { useCreatePostStore, type WorkMode } from '../../store/CreatePostStore';
import { profileStore } from '../../store/profileStore';
import { useInternshipStore } from '../../store/useInternshipStore';
import { companyInternshipStore } from '../../store/companyInternshipStore';
import { toast } from 'react-toastify';

type PostFormMode = 'create' | 'edit';

type InitialPostData = Partial<{
    title: string;
    description: string;
    location: string;
    adress: string;
    addressLine: string;
    city: string;
    postalCode: string;
    duration: string;
    sector: string;
    startDate: string;
    minSalary: string;
    maxSalary: string;
    keySkills: string[];
    workMode: WorkMode;
    isVisibleToStudents: boolean;
}>;

type PostFormProps = {
    mode?: PostFormMode;
    initialData?: InitialPostData;
    postId?: string;
};

export function CreatePostForm({ mode = 'create', initialData, postId }: PostFormProps) {
    const {
        title,
        description,
        location,
        addressLine,
        city,
        postalCode,
        duration,
        sector,
        startDate,
        minSalary,
        maxSalary,
        isVisibleToStudents,
        skills,
        workMode,
        setTitle,
        setDescription,
        setLocation,
        setAddressLine,
        setCity,
        setPostalCode,
        setDuration,
        setSector,
        setStartDate,
        setMinSalary,
        setMaxSalary,
        setIsVisibleToStudents,
        setSkills,
        addSkill,
        removeSkill,
        setWorkMode,
    } = useCreatePostStore();

    const profile = profileStore((state) => state.profile);
    const [skillInput, setSkillInput] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const navigate = useNavigate();
    const filters = useInternshipStore((state) => state.filters);
    const queryClient = useQueryClient();
    const resetInternship = useInternshipStore((state) => state.clearInternships);
    const resetDashboardInternship = companyInternshipStore((state) => state.clearInternships);
    // Pour refetcher la query
    // Pré-remplissage en mode édition
    useEffect(() => {
        if (!initialData) return;
        setTitle(initialData.title ?? '');
        setDescription(initialData.description ?? '');
        const initialAddress = initialData.addressLine ?? initialData.location ?? initialData.adress ?? '';
        setAddressLine(initialAddress);
        setCity(initialData.city ?? '');
        setPostalCode(initialData.postalCode ?? '');
        setLocation(initialAddress);
        setDuration(initialData.duration ?? '');
        setSector(initialData.sector ?? '');
        setStartDate(initialData.startDate ?? '');
        setMinSalary(initialData.minSalary ?? '');
        setMaxSalary(initialData.maxSalary ?? '');
        setIsVisibleToStudents(initialData.isVisibleToStudents ?? true);
        if (initialData.keySkills) setSkills(initialData.keySkills);
        if (initialData.workMode) setWorkMode(initialData.workMode);
    }, [
        initialData,
        setAddressLine,
        setCity,
        setDescription,
        setDuration,
        setIsVisibleToStudents,
        setLocation,
        setMaxSalary,
        setMinSalary,
        setPostalCode,
        setSector,
        setSkills,
        setStartDate,
        setTitle,
        setWorkMode,
    ]);

    // Concatène adresse/CP/ville vers location
    useEffect(() => {
        const parts = [addressLine, postalCode, city].filter((p) => p && p.trim());
        setLocation(parts.join(', '));
    }, [addressLine, postalCode, city, setLocation]);

    const sectorOptions = [
        'Technologie',
        'Informatique / IT',
        'Marketing',
        'Design',
        'Finance',
        'Communication',
        'Ressources Humaines',
        'Juridique',
        'Ingénierie',
        'Data / IA',
        'Product Management',
        'Support / Customer Success',
        'Opérations / Logistique',
        'Santé / Biotech',
        'Éducation / Formation',
    ];

    const workModeMap: Record<WorkMode, string> = {
        presentiel: 'Présentiel',
        teletravail: 'Télétravail',
        hybride: 'Hybride',
    };

    function handleSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (!skillInput.trim()) return;
            addSkill(skillInput);
            setSkillInput('');
        }
    }

    const mutation = useMutation({
        mutationFn: async (payload: { companyId: string; data: CreatePostPayload['data'] }) => {
            if (mode === 'edit') {
                if (!postId) throw new Error("Identifiant de l'annonce manquant pour la mise a jour.");
                return updatePost({ companyId: payload.companyId, postId, data: payload.data });
            }
            return createPost(payload);
        },
        onSuccess: () => {
            const successText =
                mode === 'edit'
                    ? "L'offre de stage a été mise a jour avec succès."
                    : "L'offre de stage a été créée avec succès.";

            toast.success(successText, { toastId: 'post-success' });
            navigate('/company/dashboard');
        },
        onError: (error) => {
            console.error(error);
            toast.error(
                error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi de l'offre de stage.",
                { toastId: 'post-error' },
            );
        },
    });

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (mutation.isPending) return;

        if (!profile?._id) {
            toast.error("Impossible de créer l'annonce : identifiant entreprise manquant.", {
                toastId: 'missing-company-id',
            });
            return;
        }

        if (!title.trim() || !description.trim()) {
            setFormError('Le titre et la description sont obligatoires.');
            return;
        }

        setFormError(null);

        const minSalaryNumber = Number(minSalary);
        const maxSalaryNumber = Number(maxSalary);

        const payload = {
            title,
            description,
            duration: duration || undefined,
            sector: sector || undefined,
            startDate: startDate || undefined,
            minSalary: Number.isFinite(minSalaryNumber) ? minSalaryNumber : undefined,
            maxSalary: Number.isFinite(maxSalaryNumber) ? maxSalaryNumber : undefined,
            keySkills: skills,
            adress: location || undefined,
            type: workModeMap[workMode],
            isVisible: isVisibleToStudents,
        };

        await mutation.mutateAsync({ companyId: profile._id, data: payload });
        await queryClient.invalidateQueries({
            queryKey: ['internships', filters],
        });
        await queryClient.invalidateQueries({
            queryKey: ['companyInternships', filters],
        });
        resetInternship();
        resetDashboardInternship();
    }

    return (
        <div className="w-full max-w-3xl">
            <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
                <div className="border-b border-base-100 px-6 pb-4 pt-5">
                    <h1 className="text-base font-semibold text-base-900">
                        {mode === 'edit' ? "Mettre à jour l'offre de stage" : 'Créer une offre de stage'}
                    </h1>
                </div>

                <form className="space-y-8 px-6 py-5" onSubmit={handleSubmit}>
                    <section className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-base-700">
                                Intitulé du stage <span className="text-error">*</span>
                            </label>
                            <input
                                className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder="Ex : Stagiaire Developpeur Frontend"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1" data-color-mode="light">
                            <label className="text-xs font-medium text-base-700">
                                Description du stage <span className="text-error">*</span>
                            </label>
                            <div className="rounded-xl !bg-base-100 text-sm !text-base-content shadow-sm">
                                <MDEditor
                                    value={description}
                                    onChange={(value) => setDescription(value ?? '')}
                                    height={240}
                                    preview="edit"
                                    visibleDragbar={true}
                                    className="!bg-transparent !text-base-content"
                                    previewOptions={{
                                        disableCopy: true,
                                        className: '!bg-transparent !text-base-content',
                                    }}
                                    highlightEnable={false}
                                    textareaProps={{
                                        autoComplete: 'off',
                                        spellCheck: false,
                                        style: { resize: 'vertical' },
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-base-700">Durée du stage</label>
                                <input
                                    className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Ex : 6 mois, temps plein"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-base-700">Secteur d'activité</label>
                                <select
                                    className="select select-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value)}
                                >
                                    <option value="">Choisir un secteur</option>
                                    {sectorOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 border-t border-base-100 pt-5">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-base-500">
                            Compétences & exigences du stagiaire
                        </h2>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-base-700">
                                Compétences clés (techniques / soft skills)
                            </label>

                            <div className="mb-1 flex flex-wrap gap-2">
                                {skills.map((skill) => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="badge badge-sm border-base-300 bg-base-200 text-[11px] text-base-content/80 hover:border-base-200 hover:bg-base-300/80"
                                    >
                                        {skill}
                                        <span className="ml-1 text-[10px] text-base-400">x</span>
                                    </button>
                                ))}
                            </div>

                            <input
                                className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder="Ajouter une competence et appuyer sur Entree"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleSkillKeyDown}
                            />
                            <p className="text-[11px] text-base-500">Ajoutez jusqu'à 5 compétences clés attendues.</p>
                        </div>
                    </section>

                    <section className="space-y-4 border-t border-base-100 pt-5">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-base-500">
                            Logistique & rémunération
                        </h2>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-base-700">Adresse (ligne)</label>
                                <input
                                    className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Ex : 10 rue de Rivoli"
                                    value={addressLine}
                                    onChange={(e) => setAddressLine(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-base-700">Date de début souhaitée</label>
                                <input
                                    type="date"
                                    className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content [color-scheme:light] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-base-700">Code postal</label>
                                <input
                                    className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Ex : 75001"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-base-700">Ville</label>
                                <input
                                    className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Ex : Paris"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-base-700">
                                    Gratification minimale (optionnel)
                                </label>
                                <input
                                    className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Ex : 900 € / mois (brut)"
                                    value={minSalary}
                                    onChange={(e) => setMinSalary(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-base-700">
                                    Gratification maximale (optionnel)
                                </label>
                                <input
                                    className="input input-sm w-full rounded-xl border-base-300 bg-base-100 text-sm text-base-content placeholder:text-base-content-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Ex : 1200 € / mois (brut)"
                                    value={maxSalary}
                                    onChange={(e) => setMaxSalary(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-base-700">Organisation du travail</label>
                            <div className="join w-full rounded-xl bg-base-200 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setWorkMode('presentiel')}
                                    className={`btn btn-xs sm:btn-sm join-item flex-1 border shadow-none ${
                                        workMode === 'presentiel'
                                            ? 'bg-base-100 text-base-content border-base-200'
                                            : 'bg-transparent border-0 text-base-400 hover:bg-base-300/60'
                                    }`}
                                >
                                    Présentiel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWorkMode('teletravail')}
                                    className={`btn btn-xs sm:btn-sm join-item flex-1 border shadow-none ${
                                        workMode === 'teletravail'
                                            ? 'bg-base-100 text-base-content border-base-200'
                                            : 'bg-transparent border-0 text-base-400 hover:bg-base-300/60'
                                    }`}
                                >
                                    Télétravail
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWorkMode('hybride')}
                                    className={`btn btn-xs sm:btn-sm join-item flex-1 border shadow-none ${
                                        workMode === 'hybride'
                                            ? 'bg-base-100 text-base-content border-base-200'
                                            : 'bg-transparent border-0 text-base-400 hover:bg-base-300/60'
                                    }`}
                                >
                                    Hybride
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 border-t border-base-100 pt-5">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-base-500">
                            Paramètres de publication
                        </h2>

                        <div className="form-control">
                            <label className="label cursor-pointer justify-between px-0">
                                <div className="text-[11px] text-base-500">
                                    Rendre cette offre visible aux étudiants.
                                </div>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-sm ml-4"
                                    checked={isVisibleToStudents}
                                    onChange={(e) => setIsVisibleToStudents(e.target.checked)}
                                />
                            </label>
                        </div>
                    </section>

                    <div className="flex items-center justify-end pt-3">
                        {formError && <p className="text-sm text-error mr-auto">{formError}</p>}
                        <button type="submit" className="btn btn-sm px-4 btn-primary" disabled={mutation.isPending}>
                            {mode === 'edit'
                                ? mutation.isPending
                                    ? 'Mise à jour...'
                                    : "Mettre à jour l'offre de stage"
                                : mutation.isPending
                                  ? 'Publication en cours...'
                                  : "Publier l'offre de stage"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
