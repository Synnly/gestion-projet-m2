type FormSectionProps = {
    title?: string;
    children: React.ReactNode;
    className: string;
};

export const FormSection: React.FC<FormSectionProps> = ({ title, children, className }) => {
    return (
        <div className={className}>
            <div className="border-b-2 mb-6">{title && <p className="font-bold text-2xl">{title}</p>}</div>
            {children}
        </div>
    );
};
