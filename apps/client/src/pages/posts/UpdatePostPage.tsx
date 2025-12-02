import { useLoaderData } from "react-router";
import { CreatePostForm } from "../../components/posts/CreatePostForm";
import { PostPreview } from "../../components/posts/PostPreview";
import type { LoaderPost } from "../../loaders/updatePostLoader";
import type { WorkMode } from "../../store/CreatePostStore";
import { profileStore } from "../../store/profileStore";
import { userStore } from "../../store/userStore";
import { Navbar } from "../../components/navbar/Navbar";

export default function UpdatePostPage() {
  const { post, postId } = useLoaderData() as { post: LoaderPost; companyId: string; postId: string };
  const profile = profileStore((state) => state.profile);
  const user = userStore(state=> state.access)
  const get = userStore(state=>state.get)
  const companyName = profile?.name ?? "Mon entreprise";

  const mapWorkMode = (type?: string): WorkMode => {
    if (type === "Télétravail" || type === "Teletravail") return "teletravail";
    if (type === "Hybride") return "hybride";
    return "presentiel";
  };

  // separate address into addressLine, postalCode and city
  const parseAddress = (adress?: string) => {
    if (!adress) return { addressLine: "", postalCode: "", city: "" };
    const parts = adress.split(",").map((p) => p.trim()).filter(Boolean);
    return {
      addressLine: parts[0] ?? "",
      postalCode: parts[1] ?? "",
      city: parts[2] ?? "",
    };
  };

  const parsedAddress = parseAddress(post.adress);

  const initialData = {
    title: post.title,
    description: post.description,
    location: post.adress ?? "",
    addressLine: parsedAddress.addressLine,
    city: parsedAddress.city,
    postalCode: parsedAddress.postalCode,
    duration: post.duration ?? "",
    sector: post.sector ?? "",
    startDate: post.startDate ?? "",
    minSalary: post.minSalary !== undefined ? String(post.minSalary) : "",
    maxSalary: post.maxSalary !== undefined ? String(post.maxSalary) : "",
    keySkills: post.keySkills ?? [],
    workMode: mapWorkMode(post.type as string | undefined),
    isVisibleToStudents: post.isVisible ?? true,
    createdAt:post.createdAt
  };

  return (
    <div className="min-h-screen bg-base-100">
        <Navbar />
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Mettre à jour l'annonce</h1>
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

