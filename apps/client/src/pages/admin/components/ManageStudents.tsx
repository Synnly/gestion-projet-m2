import { useState, useEffect, useCallback } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch'; // Ton hook existant
import { toast } from 'react-toastify';
import { Trash2, Search, UserX, UserCheck } from 'lucide-react';
import DeleteStudentModal from './DeleteStudentModal';

interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    deletedAt?: string;
}

export default function ManageStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    const authFetch = UseAuthFetch();
    const API_URL = import.meta.env.VITE_APIURL;

    // Charger les étudiants
    const loadStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${API_URL}/api/students/admin/all`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement des étudiants");
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, API_URL]);

    useEffect(() => {
        loadStudents();
    }, []);

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;

        setIsDeleteLoading(true);
        try {
            const response = await authFetch(`${API_URL}/api/students/${studentToDelete._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success(`Compte de ${studentToDelete.firstName} désactivé. Suppression dans 30 jours.`);
                await loadStudents();
                setStudentToDelete(null);
            } else {
                toast.error("Erreur lors de la suppression");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur technique");
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const filteredStudents = students.filter((student) =>
        (student.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (student.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestion des Étudiants</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Rechercher un étudiant..."
                        className="input input-bordered w-full max-w-xs pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : (
                <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Statut</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-gray-500">Aucun étudiant trouvé</td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => {
                                    const isScheduledForDeletion = !!student.deletedAt;

                                    return (
                                        <tr key={student._id} className={isScheduledForDeletion ? "bg-base-200 opacity-60" : ""}>
                                            <td className="font-semibold">
                                                {student.firstName} {student.lastName}
                                            </td>
                                            <td>{student.email}</td>
                                            <td>
                                                {isScheduledForDeletion ? (
                                                    <div className="badge badge-error gap-2 text-xs">
                                                        <UserX className="h-3 w-3" />
                                                        Suppression J-30
                                                    </div>
                                                ) : (
                                                    <div className="badge badge-success gap-2 text-xs">
                                                        <UserCheck className="h-3 w-3" />
                                                        Actif
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-right">
                                                {!isScheduledForDeletion && (
                                                    <button
                                                        className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                                                        onClick={() => setStudentToDelete(student)}
                                                        title="Supprimer le compte"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {studentToDelete && (
                <DeleteStudentModal
                    studentName={`${studentToDelete.firstName} ${studentToDelete.lastName}`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setStudentToDelete(null)}
                    isLoading={isDeleteLoading}
                />
            )}
        </div>
    );
}