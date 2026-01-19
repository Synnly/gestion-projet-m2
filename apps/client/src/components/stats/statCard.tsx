interface StatCardProps {
    title: string;
    value: number | undefined;
    description: string;
    iconPath: string;
    colorClass: string;
}

export const StatCard = ({ title, value, description, iconPath, colorClass }: StatCardProps) => (
    <div className="stat">
        <div className={`stat-figure ${colorClass}`}>
            <svg className="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath}></path>
            </svg>
        </div>
        <div className="stat-title">{title}</div>
        <div className={`stat-value ${colorClass}`}>{value}</div>
        <div className="stat-desc">{description}</div>
    </div>
);