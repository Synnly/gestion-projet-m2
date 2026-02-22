import { Trash2, X } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
import type { studentProfile } from '../../../../types/student.types.ts';

interface Props {
    students: studentProfile[];
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const DeleteMultipleStudentsModal = ({ students, onConfirm, onCancel, isLoading = false }: Props) => {
    const [canConfirm, setCanConfirm] = useState(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCanConfirm(e.target.value === 'Confirmer');
    };

    return (
        <>
            <div className="modal modal-open">
                <div className="modal-box min-w-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-error">
                            <Trash2 className="h-5 w-5" />
                            Suppression des comptes étudiants sélectionnés
                        </h3>
                        <button onClick={onCancel} className="btn btn-sm btn-circle btn-ghost" disabled={isLoading}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="py-4">
                        <p className="alert alert-error text-center text-error-content font-bold mb-4">
                            Vous êtes sur le point de supprimer les comptes de {students.length} étudiants. Cette action
                            sera effective dans 30 jours. Les comptes seront désactivés immédiatement.
                        </p>
                        <p>Vous allez supprimer ces comptes :</p>
                    </div>

                    <div className="overflow-y-scroll max-h-50 mb-4">
                        <table className="table table-hover w-full table-pin-rows table-zebra">
                            <thead>
                                <tr>
                                    <th>Nom Prénom</th>
                                    <th>Email</th>
                                    <th>Numéro Étudiant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student: studentProfile) => {
                                    return (
                                        <tr key={student._id}>
                                            <td className="font-semibold">
                                                {student.firstName} {student.lastName}
                                            </td>
                                            <td>{student.email}</td>
                                            <td>{student.studentNumber}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex">
                        <label className="floating-label w-full">
                            <input className="input w-full" onChange={handleInputChange} />
                            <span>Entrer "Confirmer" pour confirmer</span>
                        </label>
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                            Annuler
                        </button>
                        <button className="btn btn-error" onClick={onConfirm} disabled={isLoading || !canConfirm}>
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Traitement...
                                </>
                            ) : (
                                'Confirmer la suppression'
                            )}
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop" onClick={onCancel}></div>
            </div>
        </>
    );
};
