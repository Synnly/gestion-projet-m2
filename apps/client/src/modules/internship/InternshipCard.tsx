import React from 'react';
import Card from '../../components/ui/card/Card';
import { useInternShipStore } from '../../store/useInternShipStore';
import type { InternShip } from '../../types/internship.types';

const InternshipCard: React.FC<{ internship: InternShip; isSelected: boolean }> = ({ internship, isSelected }) => {
    const { setSelectedInternshipId } = useInternShipStore();

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
