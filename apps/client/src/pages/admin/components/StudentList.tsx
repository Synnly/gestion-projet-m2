import { useState, useEffect, useCallback } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';
import { toast } from 'react-toastify';
import { fetchStudents } from '../../../apis/student';
import type { studentProfile } from '../../../types/student.types';
import Pagination from '../../common/ui/pagination/Pagination.tsx';

export const StudentList = () => {
    const [students, setStudents] = useState<studentProfile[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const itemsPerPage = 10;

    const authFetch = UseAuthFetch();

    const loadStudents = useCallback(
        async (page: number = 1) => {
            setIsLoading(true);
            try {
                const data = await fetchStudents(authFetch, page, itemsPerPage);
                setStudents(data.data);
                setTotalPages(data.totalPages);
                setTotal(data.total);
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

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Gérer les étudiants</h1>

            <div className="mb-4 text-sm">
                Total: <span className="font-semibold">{total}</span> étudiant(s) inscrit(s)
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-12 bg-base-200 rounded-lg">
                    <p className="text-lg">Aucun étudiant inscrit</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Email</th>
                                    <th>N° Étudiant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    return (
                                        <tr key={student._id} className="hover:bg-base-200 duration-100 ease-in-out">
                                            <td className="font-semibold w-0">{student.lastName}</td>
                                            <td className="w-0">{student.firstName}</td>
                                            <td>{student.email}</td>
                                            <td className="w-0">{student.studentNumber}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => handlePageChange(page)}
                    />
                </>
            )}

            <div className="mt-8">
                <button className="btn btn-error" disabled>
                    Supprimer tous les étudiants (Non implémenté)
                </button>
            </div>
        </div>
    );
};
