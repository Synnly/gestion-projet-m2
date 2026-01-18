interface CompaniesTabProps {
    stats: any;
}

export function CompaniesTab({ stats }: CompaniesTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-base-content">Top Recruteurs</h3>
            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Entreprise</th>
                            <th>Offres postées</th>
                            <th>Taux de réponse</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats?.topCompanies?.map((company: any, index: number) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td className="font-bold">{company.name}</td>
                                <td>{company.offersCount}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <progress className="progress progress-success w-20" value={company.responseRate} max="100"></progress>
                                        <span className="text-xs">{company.responseRate}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}