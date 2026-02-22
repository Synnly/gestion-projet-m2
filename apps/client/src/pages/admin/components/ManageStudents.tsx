import { useState, useEffect, useCallback, useRef } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';
import { toast } from 'react-toastify';
import { Trash2, UserX, UserCheck } from 'lucide-react';
import DeleteStudentModal from './modals/DeleteStudentModal.tsx';
import type { studentProfile } from '../../../types/student.types.ts';
import { deleteAllStudents, deleteStudent, fetchStudents } from '../../../apis/student.ts';
import Pagination from '../../common/ui/pagination/Pagination.tsx';
import { DeleteAllStudentsModal } from './modals/DeleteAllStudentsModal.tsx';
import { DeleteMultipleStudentsModal } from './modals/DeleteMultipleStudentsModal.tsx';

export default function ManageStudents() {
    const [students, setStudents] = useState<studentProfile[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<studentProfile | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [isDeleteMultipleModalOpen, setIsDeleteMultipleModalOpen] = useState(false);
    const [studentsToDelete, setStudentsToDelete] = useState<studentProfile[]>([]);

    const itemsPerPage = 100;
    const authFetch = UseAuthFetch();
    const checkboxRefs = useRef<Map<string, HTMLInputElement>>(new Map());

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
            const updatedStudents: studentProfile[] = students.map((student) =>
                student._id === studentToDelete._id ? { ...student, deletedAt: new Date().toISOString() } : student,
            );
            setStudents(updatedStudents);
            toast.success(`Compte de ${studentToDelete.firstName} désactivé. Suppression dans 30 jours.`);
        } catch (error) {
            console.error(error);
            toast.error('Erreur technique');
        } finally {
            setStudentToDelete(null);
            setIsDeleteLoading(false);
        }
    };

    const handleDeleteMultipleConfirm = async () => {
        if (!studentsToDelete) return;

        setIsDeleteLoading(true);
        let nbErrors = 0;
        let studentsDeleted: studentProfile[] = [];
        for (const student of studentsToDelete) {
            try {
                await deleteStudent(authFetch, student._id);
                studentsDeleted.push(student);
            } catch (error) {
                console.error(error);
                nbErrors++;
            }
        }
        const updatedStudents: studentProfile[] = students.map((student) =>
            studentsDeleted.some((s) => s._id === student._id)
                ? { ...student, deletedAt: new Date().toISOString() }
                : student,
        );
        const updatedStudentsToDelete = studentsToDelete.filter(
            (s) => !studentsDeleted.some((deleted) => deleted._id === s._id),
        );
        setStudents(updatedStudents);
        setStudentsToDelete(updatedStudentsToDelete);

        if (nbErrors === 0) {
            toast.success(`Tous les comptes sélectionnés désactivés. Suppression dans 30 jours.`);
        } else {
            toast.warning(
                `${studentsToDelete.length - nbErrors} compte(s) désactivé(s) avec succès, mais ${nbErrors} compte(s) n'ont pas pu être supprimé(s). Veuillez réessayer pour les comptes restants.`,
            );
        }
        setIsDeleteLoading(false);
        setIsDeleteMultipleModalOpen(false);
    };

    const handleDeleteAllConfirm = async () => {
        setIsDeleteLoading(true);
        try {
            await deleteAllStudents(authFetch);
            const updatedStudents: studentProfile[] = students.map((student) => ({
                ...student,
                deletedAt: new Date().toISOString(),
            }));
            setStudents(updatedStudents);
            toast.success(`Tous les comptes étudiants désactivés. Suppression dans 30 jours.`);
            setIsDeleteAllModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Erreur technique');
        } finally {
            setIsDeleteLoading(false);
        }
        clearSelectedStudents();
    };

    const clearSelectedStudents = () => {
        setStudentsToDelete([]);
        checkboxRefs.current.forEach((checkbox) => {
            checkbox.checked = false;
        });
    };

    const handleStudentSelect = (student: studentProfile) => {
        if (studentsToDelete.some((s) => s._id === student._id)) {
            setStudentsToDelete(studentsToDelete.filter((s) => s._id !== student._id));
        } else {
            setStudentsToDelete([...studentsToDelete, student]);
        }
    };

    return (
        <div className="container p-6 mx-auto">
            <h1 className="text-3xl font-bold mb-6">Gérer les étudiants</h1>
            <div>
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th className="w-0" />
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Numéro Étudiant</th>
                                    <th className="text-center">Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center ">
                                            Aucun étudiant trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student: studentProfile) => {
                                        const isScheduledForDeletion = !!student.deletedAt;

                                        return (
                                            <tr key={student._id}>
                                                <td>
                                                    {!isScheduledForDeletion && (
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-sm"
                                                            ref={(el) => {
                                                                if (el) checkboxRefs.current.set(student._id, el);
                                                                else checkboxRefs.current.delete(student._id);
                                                            }}
                                                            onClick={() => handleStudentSelect(student)}
                                                        />
                                                    )}
                                                </td>
                                                <td className="font-semibold">
                                                    {student.firstName} {student.lastName}
                                                </td>
                                                <td>{student.email}</td>
                                                <td>{student.studentNumber}</td>
                                                <td
                                                    className="w-0 text-center"
                                                    colSpan={isScheduledForDeletion ? 2 : 1}
                                                >
                                                    {isScheduledForDeletion ? (
                                                        <div className="self-center badge badge-error text-xs">
                                                            <UserX className="h-3 w-3" />
                                                            Désactivé
                                                        </div>
                                                    ) : (
                                                        <div className="badge badge-success text-xs">
                                                            <UserCheck className="h-3 w-3" />
                                                            Actif
                                                        </div>
                                                    )}
                                                </td>
                                                {!isScheduledForDeletion && (
                                                    <td className="w-0">
                                                        <button
                                                            className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                                                            onClick={() => setStudentToDelete(student)}
                                                            title="Supprimer le compte"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                )}
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
                {isDeleteMultipleModalOpen && (
                    <DeleteMultipleStudentsModal
                        students={studentsToDelete}
                        onConfirm={handleDeleteMultipleConfirm}
                        onCancel={() => setIsDeleteMultipleModalOpen(false)}
                    />
                )}
            </div>
            <div className="flex gap-4 mt-8">
                <button className="btn btn-error" disabled={isLoading} onClick={() => setIsDeleteAllModalOpen(true)}>
                    Supprimer tous les étudiants
                </button>
                {studentsToDelete.length > 0 && (
                    <>
                        <button className="btn btn-secondary" onClick={clearSelectedStudents}>
                            Tout désélectionner
                        </button>
                        <button className="btn btn-error" onClick={() => setIsDeleteMultipleModalOpen(true)}>
                            Supprimer {studentsToDelete.length} étudiant{studentsToDelete.length > 1 && 's'}
                        </button>
                    </>
                )}
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={(page) => handlePageChange(page)} />
        </div>
    );
}
