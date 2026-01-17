import { Check, Clock, Eye, X } from 'lucide-react';
import type { Application } from '../../../types/application.types.ts';

export const ApplicationStatus = ({ application }: { application: Application }) => {
    let status;
    let badgeColorClass = '';
    let badgeIcon = null;
    switch (application?.status) {
        case 'Pending':
            status = 'En attente';
            badgeIcon = <Clock width={16} />;
            break;
        case 'Read':
            status = 'Lue';
            badgeColorClass = 'badge-info';
            badgeIcon = <Eye width={16} />;
            break;
        case 'Accepted':
            status = 'Acceptée';
            badgeColorClass = 'badge-success';
            badgeIcon = <Check width={16} />;
            break;
        case 'Rejected':
            status = 'Refusée';
            badgeColorClass = 'badge-error';
            badgeIcon = <X width={16} />;
            break;
        default:
            status = '';
            break;
    }

    return (
        <div className={`badge ${badgeColorClass}`}>
            {status} {badgeIcon}
        </div>
    );
};
