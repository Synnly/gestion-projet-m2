import { useMutation } from '@tanstack/react-query';
import type { companyFormLogin } from '../auth/Login/type';
import { userStore } from '../store/userStore';
import { useLocation, useNavigate } from 'react-router';
function translateMessage(message: string): string {
    if (message === 'Invalid email or password') {
        return 'email ou mot de passe invalide.';
    }
    const regex = /User with email ([\w.-]+@[\w.-]+\.\w+) not found/i;
    if (regex.test(message)) {
        return "Utilisateur avec cet email n'existe pas.";
    }

    return 'Une erreur est survenue, veuillez réessayer plus tard.';
}
export const useLogin = () => {
    const getAccess = userStore((state) => state.get);
    const setAccess = userStore((state) => state.set);
    const lastLocation = useLocation();
    const navigate = useNavigate();
    const lastLocationRoute = lastLocation.state?.from;
    const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';
    const { mutateAsync, isPending, isError, error, reset } = useMutation({
        mutationFn: async (data: companyFormLogin) => {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            if (!res.ok) {
                const message = await res.json();
                throw new Error(translateMessage(message.message));
            }
            return res;
        },
    });
    const login = async (data: companyFormLogin) => {
        const res = await mutateAsync(data);
        if (res.ok) {
            const accessToken = await res.text();
            setAccess(accessToken);
            const user = getAccess(accessToken);
            if (!user) throw new Error('Erreur lors de la récupération des informations utilisateur.');
            const redirectTo = lastLocationRoute || '/home';
            navigate(redirectTo);
        }
    };
    return { login, isPending, isError, error, reset };
};
