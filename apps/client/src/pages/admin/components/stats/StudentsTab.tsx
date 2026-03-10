import { useCallback, useEffect, useState } from 'react';
import type { studentProfile } from '../../../../types/student.types.ts';
import { UseAuthFetch } from '../../../../hooks/useAuthFetch.tsx';
import { fetchStudents } from '../../../../apis/student.ts';
import { toast } from 'react-toastify';
import Pagination from '../../../common/ui/pagination/Pagination.tsx';

interface StudentsTabProps {
    stats: any;
}

export function StudentsTab({ stats }: StudentsTabProps) {
    const [students, setStudents] = useState<studentProfile[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-base-content">Stats étudiants</h3>
            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th className="w-0">Numéro</th>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Candidatures envoyées</th>
                            <th>Candidatures acceptées</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr key={student._id}>
                                <td>{student.studentNumber}</td>
                                <td>{student.lastName}</td>
                                <td>{student.firstName}</td>
                                <td>{stats.applicationAcceptanceByStudent[student._id]?.total ?? 0}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">
                                            {stats.applicationAcceptanceByStudent[student._id]?.count ?? 0}
                                        </span>
                                        <progress
                                            className="progress progress-success w-20"
                                            value={stats.applicationAcceptanceByStudent[student._id]?.rate ?? 0}
                                            max="100"
                                        ></progress>
                                        <span className="text-xs">
                                            {stats.applicationAcceptanceByStudent[student._id]?.rate ?? 0}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={(page) => handlePageChange(page)} />
        </div>
    );
}
