import useConfirmModal from '../../hooks/useConfirmModal';
import { NavLink } from 'react-router';

import { SignupForm } from './component/signupForm';
/*
 * @Description Company Sign Up component
 */

export const CompanySignUp = () => {
    const { Modal, askUserConfirmation } = useConfirmModal();

    return (
        <>
            <div className="w-full">
                <p className="uppercase font-bold text-2xl"></p>
            </div>
            <SignupForm askUserConfirmation={askUserConfirmation} />
            <NavLink to="/company/signin" className="mt-4 text-blue-600 underline">
                Déjà un compte ? Connectez-vous
            </NavLink>
            <Modal message="Votre profil n'est pas complètement rempli. certaines fonctionnalités seront limitées" />
        </>
    );
};
