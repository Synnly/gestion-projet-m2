import React, { useState, useMemo } from 'react';

enum ReportReason {
    SPAM = 'Spam',
    INAPPROPRIATE_CONTENT = 'Contenu inapproprié',
    HARASSMENT = 'Harcèlement',
    OTHER = 'Autre',
}

interface Report {
    id: string;
    date: string; // ISO string
    reason: ReportReason;
    reportedUserEmail: string;
    messageId: string;
}

const mockReports: Report[] = [
    {
        id: '1',
        date: '2023-10-01T10:00:00Z',
        reason: ReportReason.SPAM,
        reportedUserEmail: 'user1@example.com',
        messageId: 'msg1',
    },
    {
        id: '2',
        date: '2023-10-02T11:00:00Z',
        reason: ReportReason.INAPPROPRIATE_CONTENT,
        reportedUserEmail: 'user2@example.com',
        messageId: 'msg2',
    },
    {
        id: '3',
        date: '2023-10-03T12:00:00Z',
        reason: ReportReason.HARASSMENT,
        reportedUserEmail: 'user3@example.com',
        messageId: 'msg3',
    },
    {
        id: '4',
        date: '2024-10-03T12:00:00Z',
        reason: ReportReason.HARASSMENT,
        reportedUserEmail: 'user1@example.com',
        messageId: 'msg4',
    },
    // Ajoutez plus de données fictives si nécessaire
];

type SortKey = 'date' | 'reportedUserEmail';
type SortOrder = 'asc' | 'desc';

export default function Moderation() {
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const sortedReports = useMemo(() => {
        return [...mockReports].sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            if (sortKey === 'date') {
                aValue = new Date(a.date).getTime();
                bValue = new Date(b.date).getTime();
            } else {
                aValue = a[sortKey].toLowerCase();
                bValue = b[sortKey].toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }, [sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
        <div>
            <table className="table table-zebra w-full">
                <thead>
                    <tr>
                        <th>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleSort('date')}
                            >
                                Date du signalement
                                {sortKey === 'date' && (
                                    <span className="ml-1">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </button>
                        </th>
                        <th>Raison du signalement</th>
                        <th>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleSort('reportedUserEmail')}
                            >
                                Utilisateur concerné
                                {sortKey === 'reportedUserEmail' && (
                                    <span className="ml-1">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </button>
                        </th>
                        <th>Lien vers le message</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedReports.map((report) => (
                        <tr key={report.id}>
                            <td>{formatDate(report.date)}</td>
                            <td>{report.reason}</td>
                            <td>{report.reportedUserEmail}</td>
                            <td>
                                <a
                                    href={`#message/${report.messageId}`}
                                    className="link link-primary"
                                >
                                    Voir le message
                                </a>
                            </td>
                            <td>
                                <button className="btn btn-sm btn-outline btn-error mr-2">
                                    Bannir
                                </button>
                                <button className="btn btn-sm btn-outline btn-warning">
                                    Ignorer
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}