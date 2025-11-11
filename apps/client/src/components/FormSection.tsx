type FormSectionProps = {
    title: string;
    children: React.ReactNode;
    className: string;
};

export const FormSection: React.FC<FormSectionProps> = ({ title, children, className }) => {
    return (
        <div className={className}>
            <p className="font-bold text-xl">{title}</p>
            {children}
        </div>
    );
};
