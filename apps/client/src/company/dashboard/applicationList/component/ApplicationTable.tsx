export const ApplicationTable = ({ mockedApplications, title }: any) => {
    return (
        <div className="card bg-base-100 shadow-xl h-full flex flex-col overflow-hidden m-1">
            <div className="flex-none p-4 z-20 bg-base-100">
                <div className="card-title text-lg">{title}</div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-base-100">
                <table className="table table-pin-rows">
                    <thead>
                        <tr className="bg-base-100">
                            <th>Prénom</th>
                            <th>Nom</th>
                            <th>Email</th>
                            <th className="w-px">CV</th>
                            <th className="w-px">Lettre de motivation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockedApplications?.map((mockedApplication: any) => (
                            <tr
                                key={mockedApplication._id}
                                className="hover:bg-base-200 duration-300 ease-out transition-all"
                            >
                                <td>{mockedApplication.student.firstName}</td>
                                <td>{mockedApplication.student.lastName}</td>
                                <td>{mockedApplication.student.email}</td>
                                <td>
                                    {mockedApplication.cv && (
                                        <a href={mockedApplication.cv} target="_blank" rel="noreferrer">
                                            <button className="btn btn-sm btn-ghost border-base-300">
                                                Télécharger
                                            </button>
                                        </a>
                                    )}
                                </td>
                                <td>
                                    {mockedApplication.coverLetter && (
                                        <a href={mockedApplication.coverLetter} target="_blank" rel="noreferrer">
                                            <button className="btn btn-sm btn-ghost border-base-300">
                                                Télécharger
                                            </button>
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {mockedApplications?.length === 0 && (
                    <div className="flex justify-center items-center h-20 text-base-content/50 italic">
                        Aucune candidature
                    </div>
                )}
            </div>
        </div>
    );
};
