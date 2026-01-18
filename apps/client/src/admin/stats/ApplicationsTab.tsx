import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ApplicationsTabProps {
    stats: any;
}

export function ApplicationsTab({ stats }: ApplicationsTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card bg-base-100 shadow-sm shadow-base-300 border border-base-200 p-4">
                <h3 className="text-lg font-semibold mb-4 text-base-content">État des candidatures</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats?.applicationsByStatus || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label
                            >
                                {stats?.applicationsByStatus?.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
                <h3 className="text-lg font-semibold mb-4 text-base-content">Candidatures par mois</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.applicationsOverTime || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" name="Candidatures" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}