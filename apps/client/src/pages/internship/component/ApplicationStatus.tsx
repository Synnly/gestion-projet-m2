import { Clock } from 'lucide-react';

export const ApplicationStatus = ({ status }: { status: string }) => {
    if (status === 'Pending') {
        return (
            <div className="flex flex-col items-center">
                <Clock size={48} className="text-primary mb-2" />
                <div className="px-3 py-2 rounded-3xl bg-secondary flex flex-col items-center gap-1 mb-4">
                    <span className="text-sm font-bold">Statut : En attente de réception </span>
                    <span>Votre candidature est en attente d'analyse</span>
                </div>
            </div>
        );
    }

    if (status === 'Read') {
        return (
            <div className="flex flex-col items-center">
                <Clock size={48} className="text-primary mb-2" />
                <div className="px-3 py-2 rounded-3xl bg-secondary flex flex-col items-center gap-1 mb-4">
                    <span className="text-sm font-bold">Statut : En attente de réception </span>
                    <span>Votre candidature a été reçue et est en cours d'analyse</span>
                </div>
            </div>
        );
    }
};
