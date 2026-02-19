import { Clock, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ExportStatus } from '../../../types/exportImportDB.types';

interface StatusBadgeProps {
    status: ExportStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const statusConfig = {
        [ExportStatus.PENDING]: {
            color: 'badge-warning',
            icon: <Clock className="w-4 h-4" />,
            text: 'En attente',
        },
        [ExportStatus.IN_PROGRESS]: {
            color: 'badge-info',
            icon: <Loader2 className="w-4 h-4 animate-spin" />,
            text: 'En cours',
        },
        [ExportStatus.COMPLETED]: {
            color: 'badge-success',
            icon: <CheckCircle2 className="w-4 h-4" />,
            text: 'Terminé',
        },
        [ExportStatus.CANCELLED]: {
            color: 'badge-neutral',
            icon: <XCircle className="w-4 h-4" />,
            text: 'Annulé',
        },
        [ExportStatus.FAILED]: {
            color: 'badge-error',
            icon: <AlertCircle className="w-4 h-4" />,
            text: 'Échoué',
        },
    };

    const config = statusConfig[status];
    return (
        <div className={`badge ${config.color} gap-2 p-3`}>
            {config.icon}
            <span>{config.text}</span>
        </div>
    );
}
