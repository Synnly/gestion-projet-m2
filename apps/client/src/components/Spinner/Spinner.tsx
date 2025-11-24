type Props = {
    show?: boolean;
    className?: string;
};

export default function Spinner({ show = true, className = '' }: Props) {
    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${className}`} aria-hidden>
            <div role="status" className="flex flex-col items-center gap-3">
                <span className="loading loading-spinner loading-lg text-white" aria-hidden />
                <span className="sr-only">Chargement…</span>
            </div>
        </div>
    );
}
