import React from 'react';
import type { Internship } from '../../../types/internship.types';
import { useInternshipStore } from '../../../stores/useInternshipStore';
import Card from '../../common/ui/card/Card';

const InternshipCard: React.FC<{ internship: Internship; isSelected: boolean }> = ({ internship, isSelected }) => {
    const { setSelectedInternshipId } = useInternshipStore();

    return (
        <Card
            id={internship._id}
            title={internship.title}
            subtitle={`${internship.company.name}${internship.adress ? ` • ${internship.adress}` : ''}`}
            meta={internship.duration}
            imageSrc={internship.company.logoUrl}
            isSelected={isSelected}
            onClick={(id) => id && setSelectedInternshipId(id)}
            className={`bg-base-100! border-base-300! cursor-pointer`}
        />
    );
};

export default InternshipCard;
