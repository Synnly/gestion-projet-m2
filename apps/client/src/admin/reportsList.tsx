import React, { useEffect, useState, useMemo } from 'react';
import { getAllReports, REPORT_REASON_LABELS, updateReportStatus } from '../api/reports';
import type { Report } from '../api/reports';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BanUserModal } from './components/BanUserModal';
import { ChevronDown, ChevronRight } from 'lucide-react';

type SortField = 'reportCount' | 'latestReport';
type SortDirection = 'asc' | 'desc';

type GroupedReport = {
    userId: string;
    userEmail: string;
    userName: string | null;
    userBan: { date: string; reason: string } | undefined;
    messages: MessageGroup[];
    reportCount: number;
    latestReport: Date;
};

type MessageGroup = {
    messageId: string;
    messageContent: string;
    topicId: string;
    forumId: string;
    reports: Report[];
    reportCount: number;
    latestReport: Date;
};

export default function ReportsList() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortField, setSortField] = useState<SortField>('latestReport');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [banModalOpen, setBanModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
    const limit = 50; // Reports per page

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllReports(page, limit, statusFilter || undefined);
            setReports(data.data);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page, statusFilter]);

    // Group reports by reported user, then by message
    const groupedReports = useMemo(() => {
        const grouped = new Map<string, GroupedReport>();

        reports.forEach((report) => {
            const userId = report.messageId.authorId._id;
            const messageId = report.messageId._id;
            
            if (!grouped.has(userId)) {
                const author = report.messageId.authorId;
                grouped.set(userId, {
                    userId,
                    userEmail: author.email,
                    userName: author.firstName && author.lastName 
                        ? `${author.firstName} ${author.lastName}` 
                        : null,
                    userBan: author.ban,
                    messages: [],
                    reportCount: 0,
                    latestReport: new Date(report.createdAt),
                });
            }

            const group = grouped.get(userId)!;
            
            // Find or create message group
            let messageGroup = group.messages.find(m => m.messageId === messageId);
            if (!messageGroup) {
                messageGroup = {
                    messageId,
                    messageContent: report.messageId.content,
                    topicId: report.messageId.topicId._id,
                    forumId: report.messageId.topicId.forumId,
                    reports: [],
                    reportCount: 0,
                    latestReport: new Date(report.createdAt),
                };
                group.messages.push(messageGroup);
            }
            
            messageGroup.reports.push(report);
            messageGroup.reportCount++;
            group.reportCount++;
            
            const reportDate = new Date(report.createdAt);
            if (reportDate > messageGroup.latestReport) {
                messageGroup.latestReport = reportDate;
            }
            if (reportDate > group.latestReport) {
                group.latestReport = reportDate;
            }
        });

        return Array.from(grouped.values());
    }, [reports]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedGroups = [...groupedReports].sort((a, b) => {
        let valueA: number = 0;
        let valueB: number = 0;

        switch (sortField) {
            case 'reportCount':
                valueA = a.reportCount;
                valueB = b.reportCount;
                break;
            case 'latestReport':
                valueA = a.latestReport.getTime();
                valueB = b.latestReport.getTime();
                break;
        }

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleUserExpansion = (userId: string) => {
        const newExpanded = new Set(expandedUsers);
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
        } else {
            newExpanded.add(userId);
        }
        setExpandedUsers(newExpanded);
    };

    const toggleMessageExpansion = (messageId: string) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(messageId)) {
            newExpanded.delete(messageId);
        } else {
            newExpanded.add(messageId);
        }
        setExpandedMessages(newExpanded);
    };

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        try {
            await updateReportStatus(reportId, newStatus);
            fetchReports();
        } catch (err) {
            alert('Erreur lors de la mise à jour du statut');
        }
    };

    const handleBanUser = (userId: string, userEmail: string) => {
        setSelectedUser({ id: userId, email: userEmail });
        setBanModalOpen(true);
    };

    const handleBanSuccess = () => {
        fetchReports();
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-warning text-warning-content';
            case 'resolved':
                return 'bg-success text-success-content';
            case 'rejected':
                return 'bg-error text-error-content';
            default:
                return 'bg-base-200';
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <span className="text-gray-400">⇅</span>;
        }
        return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    if (loading && reports.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-base-content">Signalements</h1>
            <div className="mb-4 flex gap-2 items-center">
                <label className="label">
                    <span className="label-text font-semibold">Filtrer par statut:</span>
                </label>
                <select
                    className="select select-bordered"
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">Tous</option>
                    <option value="pending">En attente</option>
                    <option value="resolved">Résolu</option>
                    <option value="rejected">Rejeté</option>
                </select>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {sortedGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">Aucun signalement trouvé</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th className="w-10"></th>
                                    <th className="w-1/2">Utilisateur signalé</th>
                                    <th
                                        className="w-40 cursor-pointer hover:bg-base-300"
                                        onClick={() => handleSort('reportCount')}
                                    >
                                        Nombre de signalements <SortIcon field="reportCount" />
                                    </th>
                                    <th
                                        className="w-48 cursor-pointer hover:bg-base-300"
                                        onClick={() => handleSort('latestReport')}
                                    >
                                        Dernier signalement <SortIcon field="latestReport" />
                                    </th>
                                    <th className="w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedGroups.map((group) => (
                                    <React.Fragment key={group.userId}>
                                        <tr className="hover">
                                            <td>
                                                <button
                                                    onClick={() => toggleUserExpansion(group.userId)}
                                                    className="btn btn-ghost btn-xs"
                                                >
                                                    {expandedUsers.has(group.userId) ? (
                                                        <ChevronDown size={16} />
                                                    ) : (
                                                        <ChevronRight size={16} />
                                                    )}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold ${group.userBan ? 'line-through text-gray-400' : ''}`}>
                                                        {group.userEmail}
                                                    </span>
                                                    {group.userName && (
                                                        <span className={`text-sm ${group.userBan ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                                                            {group.userName}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-primary badge-lg">
                                                    {group.reportCount}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {format(group.latestReport, 'dd/MM/yyyy HH:mm', { locale: fr })}
                                            </td>
                                            <td>
                                                <button
                                                    className={`btn btn-sm ${group.userBan ? 'btn-disabled' : 'btn-error'}`}
                                                    onClick={() =>
                                                        !group.userBan &&
                                                        handleBanUser(group.userId, group.userEmail)
                                                    }
                                                    disabled={!!group.userBan}
                                                    title={group.userBan ? 'Utilisateur déjà banni' : 'Bannir l\'utilisateur'}
                                                >
                                                    {group.userBan ? 'Utilisateur banni' : 'Bannir'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedUsers.has(group.userId) && (
                                            <tr>
                                                <td colSpan={5} className="bg-base-200 p-0">
                                                    <div className="p-4">
                                                        <table className="table table-sm w-full">
                                                            <thead>
                                                                <tr>
                                                                    <th className="w-10"></th>
                                                                    <th className="w-1/2">Message</th>
                                                                    <th className="w-32">Signalements</th>
                                                                    <th className="w-44">Dernier signalement</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.messages.map((messageGroup) => (
                                                                    <React.Fragment key={messageGroup.messageId}>
                                                                        <tr className="hover">
                                                                            <td>
                                                                                <button
                                                                                    onClick={() => toggleMessageExpansion(messageGroup.messageId)}
                                                                                    className="btn btn-ghost btn-xs"
                                                                                >
                                                                                    {expandedMessages.has(messageGroup.messageId) ? (
                                                                                        <ChevronDown size={14} />
                                                                                    ) : (
                                                                                        <ChevronRight size={14} />
                                                                                    )}
                                                                                </button>
                                                                            </td>
                                                                            <td>
                                                                                <a
                                                                                    href={`/forums/general/topics/${messageGroup.forumId}/${messageGroup.topicId}#message-${messageGroup.messageId}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="link link-primary text-xs"
                                                                                >
                                                                                    Voir le message →
                                                                                </a>
                                                                                <div className="text-xs text-gray-500 max-w-md truncate">
                                                                                    {messageGroup.messageContent}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <span className="badge badge-secondary badge-sm">
                                                                                    {messageGroup.reportCount}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap text-xs">
                                                                                {format(messageGroup.latestReport, 'dd/MM/yyyy HH:mm', { locale: fr })}
                                                                            </td>
                                                                        </tr>
                                                                        {expandedMessages.has(messageGroup.messageId) && (
                                                                            <tr>
                                                                                <td colSpan={4} className="bg-base-300 p-0">
                                                                                    <div className="p-3">
                                                                                        <table className="table table-xs w-full">
                                                                                            <thead>
                                                                                                <tr>
                                                                                                    <th className="w-40">Date</th>
                                                                                                    <th className="w-44">Raison</th>
                                                                                                    <th>Explication</th>
                                                                                                    <th className="w-36">Statut</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {messageGroup.reports.map((report) => (
                                                                                                    <tr key={report._id}>
                                                                                                        <td className="whitespace-nowrap text-xs">
                                                                                                            {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            <span className="font-semibold text-xs">
                                                                                                                {REPORT_REASON_LABELS[report.reason]}
                                                                                                            </span>
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            {report.explanation && (
                                                                                                                <span className="text-xs text-gray-500 italic max-w-xs truncate block">
                                                                                                                    {report.explanation}
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            <select
                                                                                                                className={`select select-xs select-bordered font-semibold ${getStatusBadgeColor(report.status)}`}
                                                                                                                value={report.status}
                                                                                                                onChange={(e) => handleStatusChange(report._id, e.target.value)}
                                                                                                            >
                                                                                                                <option value="pending">En attente</option>
                                                                                                                <option value="resolved">Résolu</option>
                                                                                                                <option value="rejected">Rejeté</option>
                                                                                                            </select>
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                                className="btn btn-sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                            >
                                ← Précédent
                            </button>
                            
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        className={`btn btn-sm ${page === pageNumber ? 'btn-primary' : 'btn-ghost'}`}
                                        onClick={() => setPage(pageNumber)}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                            </div>

                            <button
                                className="btn btn-sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                            >
                                Suivant →
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedUser && (
                <BanUserModal
                    userId={selectedUser.id}
                    userEmail={selectedUser.email}
                    isOpen={banModalOpen}
                    onClose={() => {
                        setBanModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={handleBanSuccess}
                />
            )}
        </div>
    );
}
