import React from 'react';
import InternshipCard, { type Internship } from './InternshipCard';
import ListContainer from '../../components/ui/list/ListContainer';
import { useJobStore } from '../../store/internShipStore';

const InternshipList: React.FC<{ internships: Internship[] }> = ({ internships }) => {
  const { selectedJobId } = useJobStore();

  return (
    <ListContainer>
      {internships.map((it) => (
        <InternshipCard key={it.id} internship={it} isSelected={it.id === selectedJobId} />
      ))}
    </ListContainer>
  );
};

export default InternshipList;
