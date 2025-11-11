import { NavLink } from 'react-router';
import { CompanyLoginForm } from './component/companyLoginForm';

export const CompanyLogin = () => {
    return (
        <>
            <CompanyLoginForm />
            <NavLink to="/company/signup" className="mt-4 text-blue-600 underline">
                Pas encore de compte ? Inscrivez-vous
            </NavLink>
        </>
    );
};
