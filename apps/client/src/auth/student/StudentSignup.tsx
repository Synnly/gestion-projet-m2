import { useState } from 'react';
import { UseAuthFetch } from '../../hooks/useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL;
export const StudentSignup = () => {
    const [success, setsuccess] = useState<string>('');
    const authFetch = UseAuthFetch();
    const createStudent = async () => {
        try {
            await authFetch(`${API_URL}/api/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({
                    role: 'STUDENT',
                    firstName: 'toto',
                    lastName: 'titi',
                    email: 'revaj85649@besenica.com',
                    password: 'A123456a!',
                }),
            });
        } catch (errors) {
            if (errors instanceof Error) {
                setsuccess(errors.message);
            }
        }
        setsuccess('succes');
    };

    return (
        <div className="flex flex-row item-center" onClick={() => createStudent()}>
            <button>s'inscrire</button>
            {success}
        </div>
    );
};
