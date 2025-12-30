import { NavLink } from 'react-router';
import { LoginForm } from './component/loginForm';
import { AnimatePresence, motion } from 'motion/react';
import Logo from '../../components/icons/Logo';

export const Login = () => {
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
                <LoginForm />
                <NavLink to="/forgot-password" className="mt-4 text-sm text-center text-gray-500 underline">
                    Mot de passe oublié ?
                </NavLink>
            </motion.div>
        </AnimatePresence>
    );
};
