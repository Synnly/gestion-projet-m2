import { useState } from 'react';
import { ChevronUp, Eye } from 'lucide-react';
import { PdfModal } from './PdfModal.tsx';

export const ApplicationTable = ({ mockedApplications, title }: any) => {
    const [isOpen, setIsOpen] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    return (
        <div
            className={`card bg-base-100 shadow-xl overflow-hidden m-1 p-3 transition-[flex] duration-500 ease-in-out ${
                isOpen ? 'flex-1 min-h-0' : 'flex-none'
            }`}
        >
            <div
                className="flex-none p-4 border-base-200 z-20 bg-base-100 flex justify-between items-center cursor-pointer hover:bg-base-200/50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="card-title text-lg select-none">
                    {title}
                    <span className="badge badge-sm badge-ghost ml-2 font-normal">
                        {mockedApplications?.length || 0}
                    </span>
                </div>

                <ChevronUp
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-5 h-5 transition-transform duration-300 ease-out ${isOpen ? 'rotate-0' : 'rotate-180'}`}
                />
            </div>

            <div className={`flex-1 overflow-y-auto min-h-0 bg-base-100 ${!isOpen && 'hidden'}`}>
                <table className="table table-pin-rows table-zebra">
                    <thead>
                        <tr className="bg-base-100">
                            <th>Prénom</th>
                            <th>Nom</th>
                            <th>Email</th>
                            <th className="w-px whitespace-nowrap text-center">CV</th>
                            <th className="w-px whitespace-nowrap text-center">Lettre de motivation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockedApplications?.map((mockedApplication: any) => (
                            <tr
                                key={mockedApplication._id}
                                className="hover:bg-base-300 duration-300 ease-out transition-color"
                            >
                                <td>{mockedApplication.student.firstName}</td>
                                <td>{mockedApplication.student.lastName}</td>
                                <td>{mockedApplication.student.email}</td>
                                <td className="whitespace-nowrap text-center">
                                    {mockedApplication.cv && (
                                        <a href={mockedApplication.cv} target="_blank" rel="noreferrer">
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => setPreviewUrl(mockedApplication.cv)}
                                            >
                                                <Eye strokeWidth={2} />
                                            </button>
                                        </a>
                                    )}
                                </td>
                                <td className="whitespace-nowrap text-center">
                                    {mockedApplication.coverLetter && (
                                        <a href={mockedApplication.coverLetter} target="_blank" rel="noreferrer">
                                            <button className="btn btn-sm btn-ghost">
                                                <Eye strokeWidth={2} />
                                            </button>
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {mockedApplications?.length === 0 && (
                    <div className="flex justify-center items-center h-20 text-base-content/50 italic">
                        Aucune candidature
                    </div>
                )}
            </div>

            {previewUrl && <PdfModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
        </div>
    );
};
