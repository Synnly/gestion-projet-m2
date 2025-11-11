type CustomFormProps = {
    label?: string;
    children: React.ReactNode;
} & React.FormHTMLAttributes<HTMLFormElement>;

export const CustomForm = ({ label, children, ...rest }: CustomFormProps) => {
    return (
        <>
            {label && (
                <div className="w-full">
                    <p className="uppercase font-bold text-2xl">{label}</p>
                </div>
            )}
            <form {...rest} className="w-full flex flex-col gap-8 mt-4 items-center">
                {children}
            </form>
        </>
    );
};
