import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function ForgotPasswordStep4() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/signin');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);
    return (
        <div className="w-full max-w-md space-y-8 p-5 bg-base-100 dark:bg-base-200 rounded-lg shadow-md flex justify-center flex-col">
            <div className="text-center">
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCyGZHkXQD-SQhpDh7YcLyhsxmM4KXOXYrUfNmFccX7oASPRULTj9IZa2uZZt8ZVbOtNh5LZn3gWWO_ldBzGIkOiyJkQ3SoqLsUWSkOwLlDdDyHSmSoYC0tNdWQjxXuK7YTaLuHtvOD3R67v4y6mC7TUVl0XHPCQhT0L7hlJHqu0tMYSMpn9b0LDlAoF8JzM5rKcCAkByrB3ZEtqFwEP3-lzO7VHY7EqwY0hgpKqh2MPxxYridXTsjDb3FYiyBG1Z4PBud9UAU1l-0"
                    alt="Logo de l'application"
                    className="mx-auto h-10 w-auto"
                />
            </div>
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold tracking-tight text-black">Mot de passe réinitialisé</h1>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                    Votre mot de passe à été réinitalisé, vous pouvez maintenant vous connectez.
                </p>
            </div>
        </div>
    );
}
