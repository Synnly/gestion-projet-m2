import MDEditor, { commands } from '@uiw/react-md-editor';

import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import { UseAuthFetch } from '../../../hooks/UseAuthFetch';
import { useMutation } from '@tanstack/react-query';
import { userStore } from '../../../store/userStore';
type MessageSenderProps = {
    topicId?: string;
    reply?: { id: string; name: string } | null;
    shown?: boolean;
    afterSend?: () => void;
    onCancel?: () => void;
    cancelReply?: () => void;
};
export function MessageSender({ topicId, reply, shown, afterSend, onCancel, cancelReply }: MessageSenderProps) {
    const [content, setContent] = useState<string | undefined>('');
    const apiUrl = import.meta.env.VITE_APIURL;
    const access = userStore((state) => state.access);
    const get = userStore((state) => state.get);
    const id = get(access)?.id;
    const authfetch = UseAuthFetch();

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async () => {
            if (!content) return;
            const url = `${apiUrl}/api/forum/topic/${topicId}/message`;
            const data = JSON.stringify({ authorId: id, content, parentMessageId: reply?.id || null });
            const response = await authfetch(`${apiUrl}/api/forum/topic/${topicId}/message`, {
                method: 'POST',
                data: data,
            });

            console.log("c'est arrivé");
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            return response.json();
        },
        onSuccess: () => {
            console.log('terminé bitchies!!!');
            setContent('');
            afterSend?.();
        },
    });
    const onSubmit = async (e: React.FormEvent) => {
        console.log('toto');
        e.preventDefault();
        const message = await mutateAsync();
        console.log(message);
    };
    return (
        <div
            className={cn(
                'rounded-lg  p-2  w-full overflow-hidden transition-all duration-400 ease-in-out bg-base-100 border-[0.5px]',
                shown ? 'max-h-[500px]' : 'max-h-[0px] opacity-0',
            )}
        >
            <div className="w-full rounded-xl border border-slate-300 bg-base-100 p-1 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 shadow-sm">
                {reply && (
                    <div className="flex items-center justify-between bg-base-100 px-4 py-2 border-b border-slate-200">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5"
                                />
                            </svg>
                            <span>
                                Répondre à <span className="font-bold text-primary">{reply.name}</span>
                            </span>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={cancelReply}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                )}
                <MDEditor
                    value={content}
                    onChange={setContent}
                    height={150}
                    preview="edit"
                    extraCommands={[]}
                    visibleDragbar={false}
                    commands={[
                        commands.bold,
                        commands.italic,
                        commands.link,
                        commands.unorderedListCommand,
                        commands.orderedListCommand,
                        commands.quote,
                        commands.codeBlock,
                    ]}
                    className="reply-editor !flex !flex-col-reverse !bg-transparent  !border-2 !shadow-none !focus:border-blue-600 !outline-none !border-none"
                    textareaProps={{
                        placeholder: 'écrivez votre réponse ici...',
                        autoComplete: 'off',
                        spellCheck: false,
                        className: 'reply-textarea !bg-transparent !text-black !outline-none !border-none',
                    }}
                />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-lg"
                    onClick={onSubmit}
                    disabled={isPending || !content}
                >
                    Envoyer le message
                </button>
                <button
                    className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-lg"
                    onClick={onCancel}
                >
                    Annulez
                </button>
            </div>
        </div>
    );
}
