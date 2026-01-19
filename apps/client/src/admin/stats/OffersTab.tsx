interface OffersTabProps {
    stats: any;
}

export function OffersTab({ stats }: OffersTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat bg-orange-50 rounded-box border border-orange-200">
                <div className="stat-title text-orange-800">Offres sans candidats</div>
                <div className="stat-value text-orange-600">{stats?.orphanOffersCount || 0}</div>
                <div className="stat-desc text-orange-700">Aucune candidature reçue</div>
            </div>
        </div>
    );
}