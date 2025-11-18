type CustomFormProps = {
    label?: string;
    children: React.ReactNode;
} & React.FormHTMLAttributes<HTMLFormElement>;

export const CustomForm = ({ label, children, ...rest }: CustomFormProps) => {
    return (
        <>
            {label && (
                <div className="px-2 text-center w-full mx-2">
                    <p className="uppercase font-bold text-2xl">{label}</p>
                </div>
            )}
            <form {...rest} className=" flex flex-col gap-8 mt-4 items-center justify-around h-full w-full">
                {children}
            </form>
        </>
    );
};
