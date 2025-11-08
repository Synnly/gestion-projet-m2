import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import signupImage from '../../../public/assets/signup-image.avif';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
const StructureType = {
    /** Government or public administration entity */
    Administration: 'Administration',
    /** Non-profit association */
    Association: 'Association',
    /** Private sector company */
    PrivateCompany: 'Private company',
    /** Public company or mixed economy company (Société d'Économie Mixte) */
    PublicCompanyOrSEM: 'Public company / SEM',
    /** Mutual or cooperative organization */
    MutualCooperative: 'Mutual cooperative',
    /** Non-Governmental Organization */
    NGO: 'NGO',
} as const;

type StructureType = (typeof StructureType)[keyof typeof StructureType];

const LegalStatus = {
    /** Entreprise Unipersonnelle à Responsabilité Limitée (Single-person limited liability company) */
    EURL: 'EURL',
    /** Société à Responsabilité Limitée (Limited liability company) */
    SARL: 'SARL',
    /** Société Anonyme (Public limited company) */
    SA: 'SA',
    /** Société par Actions Simplifiée (Simplified joint-stock company) */
    SAS: 'SAS',
    /** Société en Nom Collectif (General partnership) */
    SNC: 'SNC',
    /** Société Civile Professionnelle (Professional civil company) */
    SCP: 'SCP',
    /** Société par Actions Simplifiée Unipersonnelle (Single-person simplified joint-stock company) */
    SASU: 'SASU',
    /** Other legal status not listed above */
    OTHER: 'Other',
};

type LegalStatus = (typeof LegalStatus)[keyof typeof LegalStatus];

const companyFormSignUpSchema = z
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
type CompanyFormSignUp = z.infer<typeof companyFormSignUpSchema>; // preprocess will transform empty strings to undefined for optional fields
export const CompanySignUp = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        trigger,
    } = useForm<CompanyFormSignUp>({
        resolver: zodResolver(companyFormSignUpSchema) as Resolver<CompanyFormSignUp>,
        mode: 'onSubmit',
    });
    const onSubmit: SubmitHandler<CompanyFormSignUp> = (data) => {
        console.log(data);
    };
    const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        await trigger(['password', 'repeatPassword']);
    };
    return (
        <div className="flex flex-col-reverse xl:flex-row w-full min-h-screen flex-grow">
            <div
                id="formDiv"
                className="flex-0.5 bg-neutral-50  xl:border-r-2 xl:px-28 flex flex-col p-4  sm:pt-8 xl:pt-5 justify-start items-center"
            >
                <div className="w-full">
                    <p className="uppercase font-bold text-3xl">Inscrivez pour trouver vos futurs talents</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-8 mt-4 items-center">
                    <div className="w-full flex flex-col gap-5">
                        <p className="font-bold text-xl">Information de connexion</p>
                        <div className="flex flex-col">
                            <input
                                type="email"
                                placeholder="Email"
                                {...register('email', { required: true })}
                                className="border-1 rounded-lg p-2"
                            />

                            {errors.email && <span className="text-red-500">{errors.email.message}</span>}
                        </div>
                        <div className="flex flex-col">
                            <input
                                type="password"
                                placeholder="Mot de passe"
                                {...register('password', { required: true, onChange: handleInputChange })}
                                className="border-1 rounded-lg p-2"
                            />
                            {errors.password && <span className="text-red-500">{errors.password.message}</span>}
                        </div>
                        <div className="flex flex-col">
                            <input
                                type="password"
                                placeholder="Confirmer le mot de passe"
                                {...register('repeatPassword', { required: true, onChange: handleInputChange })}
                                className="border-1 rounded-lg p-2"
                            />

                            {errors.repeatPassword && (
                                <span className="text-red-500">{errors.repeatPassword.message}</span>
                            )}
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-5">
                        <p className="font-bold text-xl">Information sur l'entreprise</p>
                        <div className="flex flex-col">
                            <input
                                placeholder="Nom de l'entreprise"
                                type="text"
                                {...register('name', { required: true })}
                                className="border-1 rounded-lg p-2"
                            />
                            {errors.name && <span className="text-red-500">{errors.name.message}</span>}
                        </div>
                        <div className="flex flex-row w-full gap-1 ">
                            <div className="flex flex-col w-1/2">
                                <input
                                    type="text"
                                    placeholder="Numéro SIRET (14 chiffres)"
                                    {...register('siretNumber')}
                                    className="border-1 rounded-lg p-2"
                                />
                                {errors.siretNumber && (
                                    <span className="text-red-500">{errors.siretNumber.message}</span>
                                )}
                            </div>
                            <div className="flex flex-col w-1/2">
                                <input
                                    type="text"
                                    placeholder="Code NAF"
                                    {...register('nafCode')}
                                    className="border-1 rounded-lg p-2"
                                />
                                {errors.nafCode && <span className="text-red-500">{errors.nafCode.message}</span>}
                            </div>
                        </div>
                        <div className="flex flex-row gap-1">
                            <div className="flex flex-col w-1/2">
                                <select {...register('LegalStatus')} className="border-1 rounded-lg p-2 w-full">
                                    <option value="" disabled selected>
                                        Statut légal
                                    </option>
                                    {Object.values(LegalStatus).map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.LegalStatus && (
                                    <span className="text-red-500">{errors.LegalStatus.message}</span>
                                )}
                            </div>
                            <div className="flex flex-col w-1/2">
                                <select {...register('structureType')} className="border-1 rounded-lg p-2 w-full">
                                    <option value="" disabled selected>
                                        Type de structure
                                    </option>
                                    {Object.values(StructureType).map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.structureType && (
                                    <span className="text-red-500">{errors.structureType.message}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-5">
                        <p className="font-bold text-xl">Adresse</p>
                        <div className="flex flex-row gap-1">
                            <div className="flex flex-col w-1/2">
                                <input
                                    type="text"
                                    placeholder="Numéro"
                                    {...register('streetNumber')}
                                    className="border-1 rounded-lg p-2"
                                />
                                {errors.streetNumber && (
                                    <span className="text-red-500">{errors.streetNumber.message}</span>
                                )}
                            </div>
                            <div className="flex flex-col w-1/2">
                                <input
                                    type="text"
                                    placeholder="Rue"
                                    {...register('streetName')}
                                    className="border-1 rounded-lg p-2"
                                />
                                {errors.streetName && <span className="text-red-500">{errors.streetName.message}</span>}
                            </div>
                        </div>
                        <div className="flex flex-row gap-1">
                            <div className="flex flex-col w-1/2">
                                <input
                                    type="text"
                                    placeholder="Code Postal"
                                    {...register('postalCode')}
                                    className="border-1 rounded-lg p-2"
                                />
                                {errors.postalCode && <span className="text-red-500">{errors.postalCode.message}</span>}
                            </div>
                            <div className="flex flex-col w-1/2">
                                <input
                                    type="text"
                                    placeholder="Ville"
                                    {...register('city')}
                                    className="border-1 rounded-lg p-2"
                                />
                                {errors.city && <span className="text-red-500">{errors.city.message}</span>}
                            </div>
                        </div>
                    </div>
                    <input
                        type="submit"
                        value="S'inscrire"
                        className="bg-blue-600 text-white p-3 rounded-lg cursor-pointer"
                    />
                </form>
            </div>
            <div className="flex xl:w-1/2 items-center justify-center max-h-[50vh] overflow-hidden xl:max-h-screen xl:p-5">
                <div className=" w-full h-full overflow-hidden rounded-2xl shadow-lg bg-white">
                    <img src={signupImage} alt="Signup" className="w-full  h-full object-cover" />
                </div>
            </div>
        </div>
    );
};
