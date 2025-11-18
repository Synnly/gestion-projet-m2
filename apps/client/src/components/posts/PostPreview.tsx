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
  } = useCreatePostStore();

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
          ST
        </div>
        <div>
          {title && (
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          )}
          <p className="text-xs text-slate-500">{companyName}</p>
        </div>
      </div>

      {/* Duration and sector badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {duration && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            {duration}
          </span>
        )}
        {sector && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            {sector}
          </span>
        )}
      </div>

      {/* Location, start date, and salary */}
      <div className="mb-3 space-y-1 text-xs text-slate-500">
        {location && <p>📍 {location}</p>}
        {startDate && <p>📅 Début : {startDate}</p>}
        {(minSalary || maxSalary) && (
          <p>
            💶{" "}
            {minSalary && maxSalary
              ? `${minSalary} – ${maxSalary}`
              : minSalary
                ? minSalary
                : maxSalary}
          </p>
        )}
      </div>

      {/* Description */}
      {description && (
        <article
          data-color-mode="light"
          className="prose prose-sm max-w-none text-left text-slate-800 prose-headings:text-slate-900"
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
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Visibility */}
      <div className="mt-4 border-t border-slate-200 pt-3">
        <p className="text-[11px] text-slate-500">
          {isVisibleToStudents
            ? "Visible aux étudiants"
            : "Non visible aux étudiants"}
        </p>
      </div>
    </div>
  );
}
