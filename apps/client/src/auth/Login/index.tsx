import { NavLink } from 'react-router';
import { LoginForm } from './component/loginForm';
import signupImage from '../../../assets/image.png';
import { AnimatePresence, motion } from 'motion/react';
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
                    <img src={signupImage} className="h-12" />
                </div>
                <LoginForm />
                <NavLink to="/forgot-password" className=" text-blue-600 underline">
                    Mot de passe oublié ?
                </NavLink>
            </motion.div>
        </AnimatePresence>
    );
};
