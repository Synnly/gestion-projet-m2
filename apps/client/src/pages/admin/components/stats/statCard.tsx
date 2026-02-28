interface StatCardProps {
    title: string;
    value: number | undefined;
    description: string;
    iconClass: any;
    colorClass: string;
}

export const StatCard = ({ title, value, description, iconClass, colorClass }: StatCardProps) => (
    <div className="stat">
        <div className={`stat-figure ${colorClass}`}>{iconClass}</div>
        <div className="stat-title">{title}</div>
        <div className={`stat-value ${colorClass}`}>{value}</div>
        <div className="stat-desc">{description}</div>
    </div>
);
