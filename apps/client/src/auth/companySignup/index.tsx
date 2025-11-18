import { NavLink } from 'react-router';
import signupImage from '../../../assets/image.png';
import { SignupForm } from './component/signupForm';
import { AnimatePresence, motion } from 'motion/react';

export const CompanySignup = () => {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={'signup'}
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col w-full min-h-screen flex-grow items-center justify-center bg-(--color-base-200)"
            >
                <div className="p-2">
                    <img src={signupImage} className="h-12" />
                </div>
                <SignupForm />
                <NavLink to="/signin" className="mt-4 text-blue-600 underline">
                    Déjà un compte entreprise ? Connectez-vous
                </NavLink>
            </motion.div>
        </AnimatePresence>
    );
};
