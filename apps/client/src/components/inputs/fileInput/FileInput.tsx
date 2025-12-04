import { FileUploader } from 'react-drag-drop-files';
import { useState } from 'react';

const fileTypes = ['PDF', 'DOCX', 'DOC'];

export default function FileInput({ title }: { title: string }) {
    const [file, setFile] = useState(null);

    const handleChange = (file) => {
        setFile(file);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="font-medium">
                {title} <span className="text-red-500">*</span>
            </label>

            <FileUploader
                handleChange={handleChange}
                name={title}
                types={fileTypes}
                maxSize={5} // en Mo
            >
                {/* ---- Dropzone custom ---- */}
                <div
                    className="
                    border-2 border-dashed border-gray-300 
                    rounded-lg bg-gray-50 
                    p-6 text-center cursor-pointer
                    hover:border-blue-500 transition
                "
                >
                    <div className="flex flex-col items-center gap-2">
                        {/* Icône */}
                        <svg width="32" height="32" fill="gray">
                            <path d="M16 2 L28 14 H20 V28 H12 V14 H4 L16 2Z" />
                        </svg>

                        <p className="text-gray-700">
                            <span className="font-medium">Glisser-déposer</span> ou
                            <span className="text-blue-600"> parcourir</span>
                        </p>

                        <p className="text-sm text-gray-500">PDF, DOCX jusqu’à 5 Mo</p>
                    </div>
                </div>
            </FileUploader>
            {file && <p className="text-sm text-green-600 mt-1">Fichier sélectionné : {file.name}</p>}
        </div>
    );
}
