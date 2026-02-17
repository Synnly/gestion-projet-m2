import React from 'react';
import { useInternshipStore } from '../../../stores/useInternshipStore';
import type { Internship } from '../../../types/internship.types';
import Card from '../../common/ui/card/Card';

const InternshipCard: React.FC<{ internship: Internship; isSelected: boolean }> = ({ internship, isSelected }) => {
    const { setSelectedInternshipId } = useInternshipStore();

    const companyName = internship.company?.name || "Entreprise inconnue";

    const companyLogo = internship.company?.logoUrl;

    return (
        <Card
            id={internship._id}
            title={internship.title}
            // Utilisation de l'opérateur ?. (optional chaining) pour éviter le crash
            subtitle={`${companyName}${internship.adress ? ` • ${internship.adress}` : ''}`}
            meta={internship.duration}
            imageSrc={companyLogo}
            isSelected={isSelected}
            onClick={(id) => id && setSelectedInternshipId(id)}
            className={`bg-base-100! border-base-300! cursor-pointer`}
            isVisible={internship.isVisible}
        />
    );
};

export default InternshipCard;
