import { useState } from 'react';

const API_URL = import.meta.env.VITE_APIURL;

/**
 * Bouton utilitaire (dev) pour créer rapidement un compte étudiant de test.
 * Ne gère pas la connexion, il ne fait qu'appeler POST /api/students avec des données codées en dur.
 */
export const StudentSignup = () => {
    const [status, setStatus] = useState<string>('');

    const createStudent = async () => {
        setStatus('Création...');
        try {
            const res = await fetch(`${API_URL}/api/students`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'STUDENT',
                    firstName: 'toto',
                    lastName: 'titi',
                    email: 'etarnalatake2@gmail.com',
                    password: 'Azertyuiop1234*',
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(err?.message || 'Échec de la création');
            }

            setStatus('Succès : compte étudiant créé');
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Erreur inconnue');
        }
    };

    return (
        <div className="mt-4 flex flex-col items-center gap-1">
            <button className="btn btn-sm btn-secondary" onClick={createStudent}>
                Créer un étudiant de test
            </button>
            {status && <span className="text-xs text-base-content/70">{status}</span>}
        </div>
    );
};

export default StudentSignup;
