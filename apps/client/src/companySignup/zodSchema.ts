import z from 'zod';
import { LegalStatus, StructureType } from './type';

export const companyFormSignUpSchema = z
    .object({
        email: z.string().email({ message: 'Email invalide' }),
        password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
        repeatPassword: z.string(),
        siretNumber: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.string().length(14, { message: "le siret n'est pas au bon format" }).optional(),
        ),
        name: z.string().min(1, { message: "Le nom de l'entreprise est requis" }),
        nafCode: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z
                .string()
                .regex(/^[0-9]{4}[A-Za-z]$/, "Le code NAF doit avoir 4 chiffres suivis d'une lettre")
                .optional(),
        ),

        structureType: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.enum(Object.values(StructureType), { message: 'Type de structure invalide' }).optional(),
        ),
        LegalStatus: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.enum(Object.values(LegalStatus), { message: 'Statut légal invalide' }).optional(),
        ),
        streetNumber: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
        streetName: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
        postalCode: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z
                .string()
                .regex(/^[0-9]{5}$/, { message: 'Le code postal doit contenir 5 chiffres' })
                .optional(),
        ),
        city: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.string().min(1, { message: 'La ville est requise' }).optional(),
        ),
        country: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.string().min(1, { message: 'Le pays est requis' }).optional(),
        ),
    })
    .refine((data) => data.password === data.repeatPassword, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['repeatPassword'],
    });
