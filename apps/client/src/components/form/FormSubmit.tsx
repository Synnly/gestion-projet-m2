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
                <p className="text-error text-center">
                    {(() => {
                        const lines = error.message.split('\n');
                        return lines.map((line, index) => (
                            <span key={index}>
                                {line.charAt(0).toUpperCase() + line.slice(1)}
                                {index < lines.length - 1 && <br />}
                            </span>
                        ));
                    })()}
                </p>
            )}
        </>
    );
};
