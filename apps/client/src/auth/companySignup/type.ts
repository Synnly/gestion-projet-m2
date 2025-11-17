import { z } from 'zod';

export const passwordSchema = z
    .string()
    .min(8, { message: 'le mot de passe doit contenir au moins 8 caractères' })
    .refine((password) => /[A-Z]/.test(password), {
        message: 'le mot de passe doit contenir au moins une lettre majuscule',
    })
    .refine((password) => /[a-z]/.test(password), {
        message: 'le mot de passe doit contenir au moins une lettre minuscule',
    })
    .refine((password) => /[0-9]/.test(password), { message: 'Le mot de passe doit contenir au moins un chiffre' })
    .refine((password) => /[!@#$%^&*]/.test(password), {
        message: 'le mot de passe doit contenir au moins un caractère spécial',
    });

export const companyFormSignUpSchema = z
    .object({
        //is email
        email: z.string().email({ message: 'Email invalide' }),
        password: passwordSchema,
        repeatPassword: z.string(),
        name: z.string().min(1, { message: "Le nom de l'entreprise est requis" }),
    })
    .refine((data) => data.password === data.repeatPassword, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['repeatPassword'],
    });

export type loginDto = {
    email: string;
    password: string;
};
export type registerForm = {
    url: string;
    data: (Omit<companyFormSignUp, 'repeatPassword'> & { role: 'COMPANY' | 'STUDENT' | 'ADMIN' }) | loginDto;
};

// Type inferred from Zod schema for company sign-up form
export type companyFormSignUp = z.infer<typeof companyFormSignUpSchema>; // preprocess will transform empty strings to undefined for optional fields
