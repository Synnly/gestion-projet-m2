import z from 'zod';
import { IMAGE_SIZE_MAX } from '../utils/constantes.ts';

export type studentProfile = {
    _id: string;

    /** The student's email address. */
    email: string;

    /** The student's first name. */
    firstName: string;

    /** The student's last name. */
    lastName: string;

    /** Student's unique institutional number */
    studentNumber: string;

    /** Whether this account is the user's first time on the platform */
    isFirstTime: boolean;

    /** A short tagline or motto for the student. */
    tagLine?: string;

    /** A detailed biography or description of the student. */
    biography?: string;

    /** Student's profile picture object in the storage service. */
    profilePicture?: string;

    /** Student's default cv object in the storage service. */
    defaultCv?: string;
};

export const editProfilForm = z.object({
    tagLine: z.preprocess(
        (val) => (typeof val === 'string' ? (val.trim() === '' ? null : val.trim()) : null),
        z.string().max(200, { message: "La phrase d'accroche est trop longue" }).nullable(),
    ),
    biography: z.preprocess(
        (val) => (typeof val === 'string' ? (val.trim() === '' ? null : val.trim()) : null),
        z
            .string()
            .max(1000, {
                message: "Vous en avez faites des choses dans votre vie ! Malheureusement, c'est un trop long ...",
            })
            .nullable(),
    ),
    profilePicture: z
        .custom<FileList | null | undefined>()
        .refine(
            (file) => {
                if (!file || !(file[0] instanceof File)) return false;
                return file[0].size <= IMAGE_SIZE_MAX;
            },
            { message: 'Le fichier doit faire moins de 5MB' },
        )
        .refine(
            (file) => {
                if (!file || !(file[0] instanceof File)) return false;
                return ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file[0].type);
            },
            { message: 'Format non supporté : PNG, JPG, JPEG uniquement' },
        )
        .nullable(),
    defaultCv: z
        .custom<FileList | null | undefined>()
        .refine(
            (file) => {
                if (!file || !(file[0] instanceof File)) return false;
                return file[0].size <= IMAGE_SIZE_MAX;
            },
            { message: 'Le fichier doit faire moins de 5MB' },
        )
        .refine(
            (file) => {
                if (!file || !(file[0] instanceof File)) return false;
                return [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // C'est quoi ce bordel Microsoft ? C'est quoi ce type MIME de con pour les fichiers .docx ?
                ].includes(file[0].type);
            },
            { message: 'Format non supporté : PDF, DOC, DOCX uniquement' },
        )
        .nullable(),
});

export type editProfilFormType = z.infer<typeof editProfilForm>;
