import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../../components/navbar/Navbar';
import { useParams } from 'react-router';
import Spinner from '../../components/Spinner/Spinner';
import FileInput from '../../components/inputs/fileInput/FileInput';
import InternshipDetail from '../../modules/internship/InternshipDetail';
import { useState } from 'react';
export const InternshipApply = () => {
    const internshipId = useParams().postId as string;
    const { data, isLoading, error, isError } = useQuery({
        queryKey: ['internship', internshipId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_APIURL}/api/company/0/posts/${internshipId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            if (!res.ok) {
                throw new Error('Failed to fetch internship data');
            }
            return res.json();
        },
    });
    const [cv, setCv] = useState<File | null>(null);
    const [coverLetter, setCoverLetter] = useState<File | null>(null);

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <div className="flex-1 flex flex-col">
                {isLoading ? (
                    <Spinner />
                ) : (
                    <div className="bg-base-100 mt-5 flex-1 flex-col gap-3 flex">
                        <div className="container mx-auto p-6 bg-base-100 rounded-lg flex-1 flex-col">
                            <h1 className="text-3xl font-bold mb-4">Encore un petit effort</h1>
                            <form className="flex flex-col gap-6">
                                <div className="flex flex-row gap-3">
                                    <FileInput title="CV" file={cv} setFile={setCv} />
                                    <FileInput
                                        title="Lettre de motivation"
                                        file={coverLetter}
                                        setFile={setCoverLetter}
                                    />
                                </div>

                                <div className="bg-base-200 font-bold py-5">
                                    <div className="text-3xl">Annonce</div>
                                    <div className="font-bold">
                                        <InternshipDetail internship={data} applyable={false} />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
