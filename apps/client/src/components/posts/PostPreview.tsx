import { useCreatePostStore } from "../../store/CreatePostStore";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-markdown-preview/markdown.css";

type PostPreviewProps = {
  companyName: string;
};

export function PostPreview({ companyName }: PostPreviewProps) {
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
  } = useCreatePostStore();

  const workModeMap: Record<string, string> = {
    presentiel: "Présentiel",
    teletravail: "Télétravail",
    hybride: "Hybride",
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  return (
    <div className="rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-300">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
          ST
        </div>
        <div>
          {title && (
            <h3 className="text-sm font-semibold text-base-content">{title}</h3>
          )}
          <p className="text-xs text-base-content/70">{companyName}</p>
        </div>
      </div>

      {/* Duration and sector badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-base-content/70">
        {duration && (
          <span className="rounded-full bg-base-200 px-2 py-0.5">
            {duration}
          </span>
        )}
        {sector && (
          <span className="rounded-full bg-base-200 px-2 py-0.5">
            {sector}
          </span>
        )}
        {workMode && (
          <span className="rounded-full bg-base-200 px-2 py-0.5">
            {workModeMap[workMode] ?? workMode}
          </span>
        )}
      </div>

      {/* Location, start date, and salary */}
      <div className="mb-3 space-y-1 text-xs text-base-content/70">
        {location && <p>📍 {location}</p>}
        {startDate && <p>📅 Début : {formatDate(startDate)}</p>}
        {(minSalary || maxSalary) && (
          <p>
            💶{" "}
            {minSalary && maxSalary
              ? `${minSalary} € - ${maxSalary} €`
              : minSalary
                ? `${minSalary} €`
                : `${maxSalary} €`}
          </p>
        )}
      </div>

      {/* Description */}
      {description && (
        <article
          data-color-mode="light"
          className="prose prose-sm max-w-none text-left text-base-content prose-headings:text-base-content"
        >
          <MDEditor.Markdown source={description} />
        </article>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] text-base-content/80"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Visibility */}
      <div className="mt-4 border-t border-base-200 pt-3">
        <p className="text-[11px] text-base-content/70">
          {isVisibleToStudents
            ? "Visible aux étudiants"
            : "Non visible aux étudiants"}
        </p>
      </div>
    </div>
  );
}
