import { useState, KeyboardEvent, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPost } from "../../api/create_post";
import { useCreatePostStore } from "../../store/CreatePostStore";
import type { WorkMode } from "../../store/CreatePostStore";
import { profileStore } from "../../store/profileStore";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

export function CreatePostForm() {
  const {
    title,
    description,
    location,
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
    setDuration,
    setSector,
    setStartDate,
    setMinSalary,
    setMaxSalary,
    setIsVisibleToStudents,
    addSkill,
    removeSkill,
    setWorkMode,
  } = useCreatePostStore();

  const profile = profileStore((state) => state.profile);
  const [skillInput, setSkillInput] = useState("");
  const navigate = useNavigate();

  const workModeMap: Record<WorkMode, string> = {
    presentiel: "Présentiel",
    teletravail: "Télétravail",
    hybride: "Hybride",
  };

  // Add the current skill chip when the user hits Enter inside the input.
  function handleSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!skillInput.trim()) return;
      addSkill(skillInput);
      setSkillInput("");
    }
  }

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      alert("L’offre de stage a été créée avec succès.");
      navigate("/company/dashboard");
    },
    onError: (error) => {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création de l’offre de stage."
      );
    },
  });

  // Send the annonce payload to the API with the latest form state.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isLoading) return;

    if (!profile?._id) {
      alert("Impossible de créer l'annonce : identifiant entreprise manquant.");
      return;
    }

    const payload = {
      title,
      description,
      duration: duration || undefined,
      sector: sector || undefined,
      startDate: startDate || undefined,
      minSalary: minSalary ? Number(minSalary) : undefined,
      maxSalary: maxSalary ? Number(maxSalary) : undefined,
      keySkills: skills,
      adress: location || undefined,
      type: workModeMap[workMode],
      isVisible: isVisibleToStudents,
    };

    mutation.mutate({ companyId: profile._id, data: payload });
  }

  return (
    <div className="w-full max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <h1 className="text-base font-semibold text-slate-900">
            Créer une offre de stage
          </h1>
        </div>

        <form className="space-y-8 px-6 py-5" onSubmit={handleSubmit}>
          {/* Internship details */}
          <section className="space-y-4">
            {/* Title field */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Intitulé du stage
              </label>
              <input
                className="input input-sm w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ex : Stagiaire Développeur Frontend"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1" data-color-mode="light">
              <label className="text-xs font-medium text-slate-700">
                Description du stage
              </label>
              <div className="rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-sm">
                <MDEditor
                  value={description}
                  onChange={(value) => setDescription(value ?? "")}
                  height={240}
                  preview="edit"
                  className="[&_.w-md-editor]:!bg-transparent"
                />
              </div>
            </div>

            {/* Duration / sector */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Durée du stage
                </label>
                <input
                  className="input input-sm w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ex : 6 mois, temps plein"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Secteur d&apos;activité
                </label>
                <select
                  className="select select-sm w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                >
                  <option value="">Choisir un secteur</option>
                  <option value="Technologie">Technologie</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Design">Design</option>
                  <option value="Finance">Finance</option>
                  <option value="Communication">Communication</option>
                </select>
              </div>
            </div>
          </section>

          {/* Skills section */}
          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Compétences & exigences du stagiaire
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">
                Compétences clés (techniques / soft skills)
              </label>

              {/* Dynamic tags */}
              <div className="mb-1 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="badge badge-sm border-slate-200 bg-slate-100 text-[11px] text-slate-700 hover:border-slate-300 hover:bg-slate-200/80"
                  >
                    {skill}
                    <span className="ml-1 text-[10px] text-slate-400">✕</span>
                  </button>
                ))}
              </div>

              <input
                className="input input-sm w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ajouter une compétence et appuyer sur Entrée"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
              <p className="text-[11px] text-slate-500">
                Ajoutez jusqu&apos;à 5 compétences clés attendues.
              </p>
            </div>
          </section>

          {/* Logistics & compensation */}
          <section className="space-y-4 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Logistique & rémunération
            </h2>

            {/* Location / start date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Lieu du stage
                </label>
                <select
                  className="select select-sm w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">Choisir un lieu</option>
                  <option value="Paris, France">Paris, France</option>
                  <option value="Lyon, France">Lyon, France</option>
                  <option value="Marseille, France">Marseille, France</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Date de début souhaitée
                </label>
                <input
                  type="date"
                  className="input input-sm w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-900 [color-scheme:light] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* Salary range */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Gratification minimale (optionnel)
                </label>
                <input
                  className="input input-sm w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ex : 900 € / mois (brut)"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Gratification maximale (optionnel)
                </label>
                <input
                  className="input input-sm w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ex : 1200 € / mois (brut)"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                />
              </div>
            </div>

            {/* Work mode */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">
                Organisation du travail
              </label>
              <div className="join w-full rounded-xl bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setWorkMode("presentiel")}
                  className={`btn btn-xs sm:btn-sm join-item flex-1 rounded-lg border shadow-none ${
                    workMode === "presentiel"
                      ? "bg-white text-slate-900 border-slate-200"
                      : "bg-transparent border-0 text-slate-500 hover:bg-slate-200/60"
                  }`}
                >
                  Présentiel
                </button>
                <button
                  type="button"
                  onClick={() => setWorkMode("teletravail")}
                  className={`btn btn-xs sm:btn-sm join-item flex-1 rounded-lg border shadow-none ${
                    workMode === "teletravail"
                      ? "bg-white text-slate-900 border-slate-200"
                      : "bg-transparent border-0 text-slate-500 hover:bg-slate-200/60"
                  }`}
                >
                  Télétravail
                </button>
                <button
                  type="button"
                  onClick={() => setWorkMode("hybride")}
                  className={`btn btn-xs sm:btn-sm join-item flex-1 rounded-lg border shadow-none ${
                    workMode === "hybride"
                      ? "bg-white text-slate-900 border-slate-200"
                      : "bg-transparent border-0 text-slate-500 hover:bg-slate-200/60"
                  }`}
                >
                  Hybride
                </button>
              </div>
            </div>
          </section>

          {/* Settings / visibility */}
          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Paramètres de publication
            </h2>

            <div className="form-control">
              <label className="label cursor-pointer justify-between px-0">
                <div className="text-[11px] text-slate-500">
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

          {/* Footer buttons */}
          <div className="flex items-center justify-end rounded-b-2xl border-t border-slate-100 bg-slate-50/80 px-6 py-3">
            <div className="flex gap-3">
              <button
                type="submit"
                className="btn btn-xs sm:btn-sm rounded-full px-4 btn-primary text-white"
                disabled={mutation.isLoading}
              >
                {mutation.isLoading
                  ? "Publication en cours..."
                  : "Publier l'offre de stage"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
