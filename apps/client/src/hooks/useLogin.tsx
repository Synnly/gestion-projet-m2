import { useMutation } from '@tanstack/react-query';
import { userStore } from '../stores/userStore';
import { useLocation, useNavigate } from 'react-router';
import type { companyFormLogin } from '../types/Login.types';

function translateMessage(message: string): string {
    if (message === 'Invalid email or password') return 'email ou mot de passe invalide.';

    const notFoundRegex = /User with email ([\w.-]+@[\w.-]+\.\w+) not found/i;
    if (notFoundRegex.test(message)) return "Aucun utilisateur avec cet email n'existe.";

    const bannedRegex = /User with email ([\w.-]+@[\w.-]+\.\w+) is banned(?: for (.+))?/i;
    const bannedMatch = message.match(bannedRegex);
    if (bannedMatch) {
        const reason = bannedMatch[2]?.trim() || 'Raison inconnue';
        return `L'utilisateur avec cet email a été banni pour le motif suivant :\n${reason}`;
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
                const errorData = await res.json();
                throw new Error(translateMessage(errorData.message));
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

            // Check if the account is soft-deleted (pending deletion)
            if (user.deletedAt) {
                navigate('/account-restore');
                return;
            }

            // Force verification for students
            if (user.role === 'STUDENT') {
                if (!user.isVerified) {
                    navigate('/verify');
                    return;
                }
                if (user.isFirstTime) {
                    navigate('/student/changePassword');
                    return;
                }
            }

            const redirectTo = lastLocationRoute || '/home';
            navigate(redirectTo);
        }
    };

    return { login, isPending, isError, error, reset };
};
