import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast, { type ToastItem } from './Toast';

type ToastContextFn = {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextFn | null>(null);

export const useToast = (): ToastContextFn => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<ToastItem[]>([]);

    const push = useCallback((type: ToastItem['type'], message: string, title?: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const item: ToastItem = { id, type, message, title };
        setItems((s) => [item, ...s]);
        // Auto dismiss
        setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3500);
    }, []);

    const api = useMemo(
        () => ({
            success: (message: string, title?: string) => push('success', message, title),
            error: (message: string, title?: string) => push('error', message, title),
            info: (message: string, title?: string) => push('info', message, title),
        }),
        [push],
    );

    const remove = useCallback((id: string) => setItems((s) => s.filter((i) => i.id !== id)), []);

    return (
        <ToastContext.Provider value={api}>
            {children}

            <div className="fixed top-6 right-6 z-60 flex flex-col gap-3 w-[320px] pointer-events-none">
                {items.map((it) => (
                    <div key={it.id} className="pointer-events-auto">
                        <div className="toast">
                            <Toast item={it} onClose={remove} />
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
