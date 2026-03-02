import { NavLink } from 'react-router';
import { SignupForm } from './components/signupForm';
import { AnimatePresence, motion } from 'motion/react';
import Logo from '../common/icons/Logo';

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
                    <Logo className="text-primary" />
                </div>
                <SignupForm />
                <NavLink to="/signin" className="btn btn-accent text-sm text-center text-base-900">
                    Déjà un compte entreprise ? Connectez-vous
                </NavLink>
            </motion.div>
        </AnimatePresence>
    );
};
