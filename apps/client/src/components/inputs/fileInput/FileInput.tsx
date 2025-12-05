import { FileUploader } from 'react-drag-drop-files';
// Assurez-vous d'importer FileUploader de votre librairie
// import { FileUploader } from 'la-librairie-externe';

// Définition des types pour les props
interface FileInputProps {
    title: string;
    // setFile doit pouvoir accepter `File` ou `null` pour permettre l'annulation
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    file: File | null; // Le fichier peut être null si aucun n'est sélectionné
}

// Définition des types de fichiers (à adapter si nécessaire)
const fileTypes = ['PDF', 'DOCX']; // Pour l'affichage
const fileFormats = fileTypes.join(', ');
const maxSizeMo = 5;

export default function FileInput({ title, setFile, file }: FileInputProps) {
    // Fonction appelée par FileUploader lorsqu'un fichier est sélectionné
    const handleChange = (newFile: File | File[]) => {
        if (newFile instanceof File) {
            setFile(newFile);
        }
        // Si la librairie passe un tableau ou un null, vous pouvez ajouter une gestion ici
        // Ex: if (Array.isArray(newFile) && newFile.length > 0) setFile(newFile[0]);
    };

    // Fonction pour annuler la sélection du fichier
    const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
        // ESSENTIEL: Empêche l'événement de se propager au div/FileUploader,
        // ce qui rouvrirait la boîte de dialogue de fichier.
        e.stopPropagation();
        setFile(null); // Réinitialise l'état du fichier
    };

    // Contenu conditionnel à passer comme enfant de FileUploader
    const ConditionalContent = () => {
        if (file) {
            // --- Affichage du fichier sélectionné (avec option Annuler) ---
            return (
                <div
                    className="
                        border-2 border-dashed border-blue-500 
                        rounded-lg bg-blue-50 
                        p-6 text-center transition cursor-pointer
                    "
                >
                    <div className="flex flex-col items-center gap-2">
                        {/* Icône de Fichier */}
                        <svg width="32" height="32" fill="currentColor" className="text-blue-600">
                            <path d="M10 2H6a2 2 0 00-2 2v24a2 2 0 002 2h20a2 2 0 002-2V12L18 2h-8zm6 16v-2h8v2h-8zm-4 4v-2h12v2H12z" />
                        </svg>

                        <p className="text-gray-900 font-medium break-all">{file.name}</p>

                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-red-600 hover:text-red-800 font-medium text-sm transition"
                        >
                            Annuler et retirer le fichier
                        </button>

                        <p className="text-sm text-gray-500">
                            {fileFormats} jusqu’à {maxSizeMo} Mo
                        </p>
                    </div>
                </div>
            );
        }

        // --- Affichage par défaut (Glisser-déposer / Parcourir) ---
        return (
            <div
                className="
                    border-2 border-dashed border-gray-300 
                    rounded-lg bg-gray-50 
                    p-6 text-center cursor-pointer
                    hover:border-blue-500 transition
                "
            >
                <div className="flex flex-col items-center gap-2">
                    {/* Icône de Téléchargement */}
                    <svg width="32" height="32" fill="gray">
                        <path d="M16 2 L28 14 H20 V28 H12 V14 H4 L16 2Z" />
                    </svg>

                    <p className="text-gray-700">
                        <span className="font-medium">Glisser-déposer</span> ou
                        <span className="text-blue-600"> parcourir</span>
                    </p>

                    <p className="text-sm text-gray-500">
                        {fileFormats} jusqu’à {maxSizeMo} Mo
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="font-medium">
                {title} <span className="text-red-500">*</span>
            </label>

            <FileUploader
                handleChange={handleChange}
                name={title}
                // Assurez-vous que les types sont formatés correctement pour la librairie
                types={fileTypes}
                maxSize={maxSizeMo}
            >
                {/* Injection du contenu conditionnel */}
                <ConditionalContent />
            </FileUploader>
        </div>
    );
}
