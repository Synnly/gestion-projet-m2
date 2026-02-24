import React from 'react';
import { useInternshipStore } from '../../../stores/useInternshipStore';
import type { Internship } from '../../../types/internship.types';
import Card from '../../common/ui/card/Card';
import type { ApplicationCount } from '../../../types/application.types';
import { Users } from 'lucide-react';

const ApplicationCountBadge: React.FC<{ counts: ApplicationCount }> = ({ counts }) => {
    const allRead = counts.unread === 0;

    return (
        <div className="flex items-center gap-1.5 text-nowrap">
            <span className="flex items-center gap-0.5">
                <Users size={11} className="shrink-0 text-base-content/50" />
                <span className="tabular-nums">{counts.total}</span>
            </span>

            {allRead ? (
                <span className="text-success/80 font-medium">✓</span>
            ) : (
                <>
                    <span className="text-base-content/30">·</span>
                    <span className="text-warning font-semibold tabular-nums">
                        {counts.unread} non lue{counts.unread > 1 ? 's' : ''}
                    </span>
                </>
            )}
        </div>
    );
};

const InternshipCard: React.FC<{
    internship: Internship;
    isSelected: boolean;
    counts?: ApplicationCount;
}> = ({ internship, isSelected, counts }) => {
    const { setSelectedInternshipId } = useInternshipStore();

    const companyName = internship.company?.name || 'Entreprise inconnue';
    const companyLogo = internship.company?.logoUrl;

    return (
        <Card
            id={internship._id}
            title={internship.title}
            subtitle={`${companyName}${internship.adress ? ` • ${internship.adress}` : ''}`}
            meta={counts !== undefined ? <ApplicationCountBadge counts={counts} /> : internship.duration}
            imageSrc={companyLogo}
            isSelected={isSelected}
            onClick={(id) => id && setSelectedInternshipId(id)}
            className="bg-base-100! border-base-300! cursor-pointer"
            isVisible={internship.isVisible}
        />
    );
};

export default InternshipCard;
