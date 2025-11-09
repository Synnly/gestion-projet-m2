import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import signupImage from '../../../assets/signup-image.avif';
import { zodResolver } from '@hookform/resolvers/zod';
import useConfirmModal from '../hooks/useConfirmModal';
import { NavLink } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { companyFormSignUpSchema } from './zodSchema';
import type { companyFormSignUp } from './type';
import { userStore } from '../store/userStore';
import { LegalStatus, StructureType } from './type';

/*
 * @Description Company Sign Up component
 */

export const CompanySignUp = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        trigger,
        clearErrors,
    } = useForm<companyFormSignUp>({
        resolver: zodResolver(companyFormSignUpSchema) as Resolver<companyFormSignUp>,
        mode: 'onSubmit',
    });

    const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

    const setUser = userStore((state) => state.set);

    const { mutateAsync, isPending, isError, error } = useMutation({
        mutationFn: async (data: companyFormSignUp) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
            return await res.json();
        },
    });
    const { Modal, askUserConfirmation } = useConfirmModal();

    const onSubmit: SubmitHandler<companyFormSignUp> = async (data: companyFormSignUp) => {
        let confirmed = true;
        if (!isComplete(data)) confirmed = await askUserConfirmation();
        if (confirmed) {
            const user = await mutateAsync(data);
            setUser(user.id, user.role);
        }
    };

    const handleInputChange = async () => {
        await trigger(['password', 'repeatPassword']);
    };

    return (
        <>
            <div className="flex flex-col-reverse xl:flex-row w-full min-h-screen flex-grow">
                <div className="flex-1 bg-neutral-50  xl:border-r-2 xl:px-28 flex flex-col p-4 min-h-full justify-center sm:pt-8 xl:pt-5">
                    <div id="formDiv" className=" justify-start items-center">
                        <div className="w-full">
                            <p className="uppercase font-bold text-3xl">Inscrivez pour trouver vos futurs talents</p>
                        </div>
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            onClick={() => clearErrors()}
                            className="w-full flex flex-col gap-8 mt-4 items-center"
                        >
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
                                        {errors.nafCode && (
                                            <span className="text-red-500">{errors.nafCode.message}</span>
                                        )}
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
                                        <select
                                            {...register('structureType')}
                                            className="border-1 rounded-lg p-2 w-full"
                                        >
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
                                        {errors.streetName && (
                                            <span className="text-red-500">{errors.streetName.message}</span>
                                        )}
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
                                        {errors.postalCode && (
                                            <span className="text-red-500">{errors.postalCode.message}</span>
                                        )}
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
                                value={isPending ? "S'inscrire" : 'Inscription...'}
                                className="bg-blue-600 text-white p-3 rounded-lg cursor-pointer"
                            />
                            {isError && <p className="text-red-500">{error.message}</p>}
                        </form>
                        <NavLink to="/company/login" className="mt-4 text-blue-600 underline">
                            Déjà un compte ? Connectez-vous
                        </NavLink>
                    </div>
                </div>
                <div className="flex xl:w-1/2 items-center justify-center max-h-[50vh] overflow-hidden xl:max-h-screen xl:p-5">
                    <div className=" w-full h-full overflow-hidden rounded-2xl shadow-lg bg-white">
                        <img src={signupImage} alt="Signup" className="w-full  h-full object-cover" />
                    </div>
                </div>
            </div>
            <Modal message="Votre profil n'est pas complètement rempli. certaines fonctionnalités seront limitées"/>
        </>
    );
};
function isComplete(data: {
    email: string;
    password: string;
    repeatPassword: string;
    name: string;
    siretNumber?: string | undefined;
    nafCode?: string | undefined;
    structureType?:
        | 'Administration'
        | 'Association'
        | 'Private company'
        | 'Public company / SEM'
        | 'Mutual cooperative'
        | 'NGO'
        | undefined;
    LegalStatus?: string | undefined;
    streetNumber?: string | undefined;
    streetName?: string | undefined;
    postalCode?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
}) {
    return (
        data.siretNumber &&
        data.nafCode &&
        data.structureType &&
        data.LegalStatus &&
        data.streetNumber &&
        data.streetName &&
        data.postalCode &&
        data.city &&
        data.country
    );
}
