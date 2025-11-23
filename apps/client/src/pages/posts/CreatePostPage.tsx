import { CreatePostForm } from "../../components/posts/CreatePostForm";
import { PostPreview } from "../../components/posts/PostPreview";
import { profileStore } from "../../store/profileStore";

export default function CreatePostPage() {
  const profile = profileStore((state) => state.profile);
  const companyName = profile?.name ?? "Mon entreprise";

  return (
    <div data-theme="bumblebee" className="min-h-screen bg-base-200 py-10">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        {/* Page title */}
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          Creer une nouvelle annonce de stage
        </h1>

        {/* Layout: form on the left, preview on the right */}
        <div className="flex flex-col gap-8 md:flex-row items-start">
          {/* Form on the left */}
          <div className="flex-1">
            <CreatePostForm />
          </div>

          {/* Preview on the right, sticky on desktop */}
          <aside className="w-full md:w-[40%] space-y-3 md:sticky md:top-6">
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
