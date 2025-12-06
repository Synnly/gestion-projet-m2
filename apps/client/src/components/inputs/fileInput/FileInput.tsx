import { Upload, X } from 'lucide-react';
import { FileUploader } from 'react-drag-drop-files';

interface FileInputProps {
    title: string;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    file: File | null;
}

const fileTypes = ['PDF', 'DOCX', 'DOC']; // Pour l'affichage
const fileFormats = fileTypes.join(', ');
const maxSizeMo = 5;

export default function FileInput({ title, setFile, file }: FileInputProps) {
    const handleChange = (newFile: File | File[]) => {
        if (newFile instanceof File) {
            setFile(newFile);
        }
    };

    const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setFile(null);
    };

    const ConditionalContent = () => {
        if (file) {
            return (
                <div className="flex flex-col items-center gap-2" style={{ pointerEvents: 'none' }}>
                    <svg width="32" height="32" fill="currentColor" className="text-blue-600">
                        <path d="M10 2H6a2 2 0 00-2 2v24a2 2 0 002 2h20a2 2 0 002-2V12L18 2h-8zm6 16v-2h8v2h-8zm-4 4v-2h12v2H12z" />
                    </svg>
                    <p className="text-secondary-content font-medium break-all">{file.name}</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center gap-2">
                <Upload />
                <p className="text-gray-700">
                    <span className="font-medium">Glisser-déposer</span> ou
                    <span className="text-blue-600"> parcourir</span>
                </p>
                <p className="text-sm text-gray-500">
                    {fileFormats} jusqu’à {maxSizeMo} Mo
                </p>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="font-medium">
                {title} <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full">
                {file && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-800 font-medium text-sm transition absolute top-2 right-2 z-20"
                    >
                        <X />
                    </button>
                )}

                <FileUploader
                    handleChange={handleChange}
                    name={title}
                    types={fileTypes}
                    maxSize={maxSizeMo}
                    disabled={!!file}
                >
                    <div
                        className="
                            border-2 border-dashed border-gray-300 
                            rounded-lg bg-base-300 
                            p-6 text-center cursor-pointer
                            hover:border-blue-500 transition
                            relative min-h-[150px]
                        "
                    >
                        <ConditionalContent />
                    </div>
                </FileUploader>
            </div>
        </div>
    );
}
