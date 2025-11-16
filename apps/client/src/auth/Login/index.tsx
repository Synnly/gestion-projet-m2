import { NavLink } from 'react-router';
import { LoginForm } from './component/loginForm';
import signupImage from '../../../assets/image.png';
export const Login = () => {
    return (
            
            <div className="flex flex-col w-full min-h-screen flex-grow items-center bg-(--color-base-200)">
                <div className='p-2'><img src={signupImage} className='h-12'/></div>
                <LoginForm/>               
                <NavLink to="/company/signup" className="mt-4 text-blue-600 underline">
                    Pas encore de compte entreprise ? Inscrivez-vous
                </NavLink>
                <NavLink to="" className="mt-4 text-blue-600 underline">
                    Pas encore de compte etudiants ? Inscrivez-vous
                </NavLink>
            </div>

    );
};
