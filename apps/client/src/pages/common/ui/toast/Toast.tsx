export type ToastItem = {
    id: string;
    type?: 'success' | 'error' | 'info';
    title?: string;
    message: string;
};

export default function Toast({ item, onClose }: { item: ToastItem; onClose: (id: string) => void }) {
    return (
        <div
            className={`alert shadow-lg ${
                item.type === 'error' ? 'alert-error' : item.type === 'success' ? 'alert-success' : 'alert-info'
            }`}
            role="status"
        >
            <div>
                {item.title && <span className="font-bold block">{item.title}</span>}
                <span className="block text-white text-lg">{item.message}</span>
            </div>
            <div className="flex-none">
                <button className="btn btn-ghost btn-sm" onClick={() => onClose(item.id)} aria-label="Fermer">
                    ✕
                </button>
            </div>
        </div>
    );
}
