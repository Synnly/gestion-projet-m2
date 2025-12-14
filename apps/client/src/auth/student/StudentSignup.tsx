import { useState } from 'react';

const API_URL = import.meta.env.VITE_APIURL;
export const StudentSignup = () => {
    const [success, setsuccess] = useState<String>('');
    const createStudent = async () => {
        try {
            await fetch(`${API_URL}/api/students`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
