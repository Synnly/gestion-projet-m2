type FormSubmitProps = {
    isPending?: boolean;
    isError?: boolean;
    title: string;
    pendingTitle?: string;
    error?: Error | null;
    className?: string;
};

export const FormSubmit = ({ isPending, isError, title, pendingTitle, error, className, ...rest }: FormSubmitProps) => {
    return (
        <>
            <input
                type="submit"
                value={isPending != null ? (!isPending ? title : pendingTitle) : title}
                className={`btn ${className}`}
                {...rest}
            />
            {isError && error && error.message && (
                <p className="text-error">{error.message.charAt(0).toUpperCase() + error.message.slice(1)}</p>
            )}
        </>
    );
};
