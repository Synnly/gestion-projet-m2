import z from 'zod';

export type companyFormLogin = {
    email: string;
    password: string;
};

export const companyFormLoginSchema = z.object({
    email: z.string().min(1, { message: "L'email est requis" }).email({ message: 'Email invalide' }),
    password: z.string().min(1, { message: 'Le mot de passe est requis' }),
});
