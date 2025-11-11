import z from 'zod';
import { passwordSchema } from '../companySignup/type';

export type companyFormLogin = {
    email: string;
    password: string;
};

export const companyFormLoginSchema = z.object({
    email: z.string().min(1, { message: "L'email est requis" }).email({ message: 'Email invalide' }),
    password: passwordSchema,
});
