import { useLoaderData } from 'react-router';
import { CreatePostForm } from '../../components/posts/CreatePostForm';
import { Navbar } from '../../components/navbar/Navbar';
import type { Internship } from '../../types/internship.types.ts';
import { PostPreview } from '../../components/posts/PostPreview.tsx';

export default function UpdatePostPage() {
    const { post, postId } = useLoaderData() as { post: Internship; companyId: string; postId: string };

    // separate address into addressLine, postalCode and city
    const parseAddress = (adress?: string) => {
        if (!adress) return { addressLine: '', postalCode: '', city: '' };
        const parts = adress
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
        return {
            addressLine: parts[0] ?? '',
            postalCode: parts[1] ?? '',
            city: parts[2] ?? '',
        };
    };

    const parsedAddress = parseAddress(post.adress);

    const initialData = {
        title: post.title,
        description: post.description,
        location: post.adress ?? '',
        addressLine: parsedAddress.addressLine,
        city: parsedAddress.city,
        postalCode: parsedAddress.postalCode,
        duration: post.duration ?? '',
        sector: post.sector ?? '',
        startDate: post.startDate ?? '',
        minSalary: post.minSalary,
        maxSalary: post.maxSalary,
        keySkills: post.keySkills ?? [],
        type: post.type ?? '',
        isVisibleToStudents: post.isVisible ?? true,
        isCoverLetterRequired: post.isCoverLetterRequired ?? false,
        createdAt: post.createdAt,
    };

    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />
            <div className="mx-auto px-4 lg:px-8 mb-8">
                <h1 className="my-6 text-3xl font-bold text-base-content text-center w-1/2">Mettre à jour l'annonce</h1>
                <div className="flex flex-col gap-8 md:flex-row items-start">
                    <div className="flex">
                        <CreatePostForm mode="edit" postId={postId} initialData={initialData} />
                    </div>
                    <aside className="w-full md:flex-2 space-y-3 md:sticky md:top-6">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content">
                            Apercu en direct
                        </h2>
                        <PostPreview company={post.company} />
                    </aside>
                </div>
            </div>
        </div>
    );
}
