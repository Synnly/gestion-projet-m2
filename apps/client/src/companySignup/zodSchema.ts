import z from 'zod';
import { LegalStatus, StructureType } from './type';
import { useNafStore } from '../store/nafStore';
const nafList = useNafStore.getState().nafList

// zod schema of companySignup

export const companyFormSignUpSchema = z
.object({
    //is email
    email: z.string().email({ message: 'Email invalide' }),
    //is minimum 8 characters
    password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
    repeatPassword: z.string(),
    // is a optional string of minimum 14 characters
    siretNumber: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().length(14, { message: "le siret n'est pas au bon format" }).optional(),
    ),
    // is required
    name: z.string().min(1, { message: "Le nom de l'entreprise est requis" }),
    // value is object with valid code
    nafCode: z.preprocess(
    (val) => (val === "" ? undefined : JSON.parse(val as string)),
    z
      .object({
        code: z.string(),
        activite: z.string(),
      })
      .refine(
        (val) => !!val && nafList.some((n) => n.code === val.code),
        { message: "Veuillez choisir un code NAF valide" }
      )
      .optional()
  ),
    //is a optional valid structured type 
    structureType: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.enum(Object.values(StructureType), { message: 'Type de structure invalide' }).optional(),
    ),

    //is valid legal status
    LegalStatus: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.enum(Object.values(LegalStatus), { message: 'Statut légal invalide' }).optional(),
    ),
    // is a optional string representing a number
    streetNumber: z.preprocess((val) => (val === '' ? undefined : val),
        z.string()
            .refine(val => !isNaN(Number(val)),
                {message:"Le numéro de rue doit être un nombre"})
            .optional()),
    //is a optional string
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
