import { NavLink } from 'react-router';
import signupImage from '../../../assets/image.png';
import { SignupForm } from './component/signupForm';

export const CompanySignup = () => {
    return (
        <div className="flex flex-col w-full min-h-screen flex-grow items-center bg-(--color-base-200)">
            <div className="p-2">
                <img src={signupImage} className="h-12" />
            </div>
            <SignupForm />
            <NavLink to="/signin" className="mt-4 text-blue-600 underline">
                Déjà un compte entreprise ? Connectez-vous
            </NavLink>
        </div>
    );
};
