import { useLoaderData } from "react-router";
import { CreatePostForm } from "../../components/posts/CreatePostForm";
import { PostPreview } from "../../components/posts/PostPreview";
import type { LoaderPost } from "../../loaders/updatePostLoader";
import type { WorkMode } from "../../store/CreatePostStore";
import { profileStore } from "../../store/profileStore";

export default function UpdatePostPage() {
  const { post, postId } = useLoaderData() as { post: LoaderPost; companyId: string; postId: string };
  const profile = profileStore((state) => state.profile);
  const companyName = profile?.name ?? "Mon entreprise";

  const mapWorkMode = (type?: string): WorkMode => {
    if (type === "Télétravail") return "teletravail";
    if (type === "Hybride") return "hybride";
    return "presentiel";
  };

  const initialData = {
    title: post.title,
    description: post.description,
    location: post.adress ?? "",
    duration: post.duration ?? "",
    sector: post.sector ?? "",
    startDate: post.startDate ?? "",
    minSalary: post.minSalary !== undefined ? String(post.minSalary) : "",
    maxSalary: post.maxSalary !== undefined ? String(post.maxSalary) : "",
    keySkills: post.keySkills ?? [],
    workMode: mapWorkMode(post.type as string | undefined),
    isVisibleToStudents: post.isVisible ?? true,
  };

  return (
    <div data-theme="bumblebee" className="min-h-screen bg-base-200 py-10">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Mettre a jour l'annonce</h1>
        <div className="flex flex-col gap-8 md:flex-row items-start">
          <div className="flex-[3]">
            <CreatePostForm mode="edit" postId={postId} initialData={initialData} />
          </div>
          <aside className="w-full md:flex-[2] space-y-3 md:sticky md:top-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Apercu en direct
            </h2>
            <PostPreview companyName={companyName} />
          </aside>
        </div>
      </div>
    </div>
  );
}
