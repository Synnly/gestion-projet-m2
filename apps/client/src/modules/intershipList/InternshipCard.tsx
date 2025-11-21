import React from 'react';
import Card from '../../components/ui/card/Card';
import { useJobStore } from '../../store/internShipStore';

export type Internship = {
  id: string;
  title: string;
  company: string;
  location?: string;
  logo?: string;
  postedAt?: string;
  type?: string;
  category?: string;
};

const InternshipCard: React.FC<{ internship: Internship; isSelected: boolean }> = ({ internship, isSelected }) => {
  const { setSelectedJobId } = useJobStore();

  return (
    <Card
      id={internship.id}
      title={internship.title}
      subtitle={`${internship.company}${internship.location ? ` • ${internship.location}` : ''}`}
      meta={internship.postedAt}
      imageSrc={internship.logo}
      isSelected={isSelected}
      onClick={(id) => id && setSelectedJobId(id)}
        className={`bg-base-100! border-base-300!`}
    />
  );
};

export default InternshipCard;
