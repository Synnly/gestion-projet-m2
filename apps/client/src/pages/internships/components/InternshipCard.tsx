import React from 'react';
import { useInternshipStore } from '../../../stores/useInternshipStore';
import type { Internship } from '../../../types/internship.types';
import Card from '../../common/ui/card/Card';
import { useMutation } from '@tanstack/react-query';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';

const InternshipCard: React.FC<{ internship: Internship; isSelected: boolean }> = ({ internship, isSelected }) => {
    const { setSelectedInternshipId } = useInternshipStore();

    const companyName = internship.company?.name || 'Entreprise inconnue';
    const API_URL = import.meta.env.VITE_API_URL;
    const authFetch = UseAuthFetch();
    const mutation = useMutation({
        mutationFn: async (id: string) => {
            await authFetch(`${API_URL}/api/posts/saw/${id}`, {
                method: 'GET',
            });
        },
        onError: (error) => {
            console.error('Error marking internship as seen:', error);
        },
        onSuccess: () => {
            console.log('Internship marked as seen successfully');
        },
    });
    const companyLogo = internship.company?.logoUrl;
    const handleClick = async (id: string) => {
        setSelectedInternshipId(id);
        await mutation.mutateAsync(id);
    };
    return (
        <Card
            id={internship._id}
            title={internship.title}
            subtitle={`${companyName}${internship.adress ? ` • ${internship.adress}` : ''}`}
            meta={internship.duration}
            imageSrc={companyLogo}
            isSelected={isSelected}
            onClick={(id) => id && handleClick(id)}
            className={`bg-base-100! border-base-300! cursor-pointer`}
            isVisible={internship.isVisible}
        />
    );
};

export default InternshipCard;
