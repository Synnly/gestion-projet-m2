import { Clock } from 'lucide-react';

export const ApplicationStatus = ({ status }: { status: string }) => {
    if (status === 'Pending') {
        return (
            <div className="flex flex-col items-center">
                <Clock size={64} className="text-primary mb-2" />
                <div className="px-3 py-2 rounded-3xl bg-secondary flex flex-col items-center gap-1 mb-4">
                    <span className="text-lg font-bold">Statut : En attente de réception </span>
                    <span> Votre candidature est en attente</span>
                </div>
            </div>
        );
    }
};
