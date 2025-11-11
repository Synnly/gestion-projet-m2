type FormSubmitProps = {
    isPending?: boolean;
    isError: boolean;
    title: string;
    pendingTitle: string;
    error?: Error | null;
    className?: string;
};

export const FormSubmit = ({ isPending, isError, title, pendingTitle, error, className }: FormSubmitProps) => {
    return (
        <>
            <input
                type="submit"
                value={isPending != null ? (!isPending ? title : pendingTitle) : title}
                className={className}
            />
            {isError && <p className="text-red-500">{error?.message}</p>}
        </>
    );
};
