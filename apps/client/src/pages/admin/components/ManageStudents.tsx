import { useState, useEffect, useCallback } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';
import { toast } from 'react-toastify';
import { Trash2, Search, UserX, UserCheck } from 'lucide-react';
import DeleteStudentModal from './DeleteStudentModal';
import type { studentProfile } from '../../../types/student.types.ts';
import { deleteAllStudents, deleteStudent, fetchStudents } from '../../../apis/student.ts';
import Pagination from '../../common/ui/pagination/Pagination.tsx';
import { DeleteAllStudentsModal } from './DeleteAllStudentsModal.tsx';

export default function ManageStudents() {
    const [students, setStudents] = useState<studentProfile[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentToDelete, setStudentToDelete] = useState<studentProfile | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

    const itemsPerPage = 100;
    const authFetch = UseAuthFetch();

    const loadStudents = useCallback(
        async (page: number = 1) => {
            setIsLoading(true);
            try {
                const data = await fetchStudents(authFetch, page, itemsPerPage);
                setStudents(data.data);
                setTotalPages(data.totalPages);
            } catch (error) {
                toast.error('Erreur lors du chargement des étudiants');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        },
        [authFetch, itemsPerPage],
    );

    useEffect(() => {
        loadStudents(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;

        setIsDeleteLoading(true);
        try {
            await deleteStudent(authFetch, studentToDelete._id);
            toast.success(`Compte de ${studentToDelete.firstName} désactivé. Suppression dans 30 jours.`);
        } catch (error) {
            console.error(error);
            toast.error('Erreur technique');
        } finally {
            setStudentToDelete(null);
            setIsDeleteLoading(false);
        }
    };

    const handleDeleteAllConfirm = async () => {
        setIsDeleteLoading(true);
        try {
            await deleteAllStudents(authFetch);
            toast.success(`Tous les comptes étudiants désactivés. Suppression dans 30 jours.`);
        } catch (error) {
            console.error(error);
            toast.error('Erreur technique');
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const filteredStudents = students.filter(
        (student) =>
            (student.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (student.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="container mx-auto">
            <div>
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
                                    <th>Numéro Étudiant</th>
                                    <th>Statut</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4 text-gray-500">
                                            Aucun étudiant trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student: studentProfile) => {
                                        const isScheduledForDeletion = !!student.deletedAt;

                                        return (
                                            <tr
                                                key={student._id}
                                                className={isScheduledForDeletion ? 'bg-base-200 opacity-60' : ''}
                                            >
                                                <td className="font-semibold">
                                                    {student.firstName} {student.lastName}
                                                </td>
                                                <td>{student.email}</td>
                                                <td>{student.studentNumber}</td>
                                                <td className="w-0">
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
                                                <td className="text-right w-0">
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
                {isDeleteAllModalOpen && (
                    <DeleteAllStudentsModal
                        onConfirm={handleDeleteAllConfirm}
                        onCancel={() => {
                            setIsDeleteAllModalOpen(false);
                        }}
                    />
                )}
            </div>
            <div className="mt-8">
                <button className="btn btn-error" disabled={isLoading} onClick={() => setIsDeleteAllModalOpen(true)}>
                    Supprimer tous les étudiants
                </button>
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={(page) => handlePageChange(page)} />
        </div>
    );
}
