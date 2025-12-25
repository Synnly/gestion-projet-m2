import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { userStore } from '../../../store/userStore';
import { cn } from '../../../utils/cn';
import type { MessageType, Role } from '../TopicDetailPage';
export const MessageItem = ({
    message,
    onReply,
}: {
    message: MessageType;
    onReply?: (id: string, name: string) => void;
}) => {
    const { authorId } = message;
    const displayName =
        'firstName' in authorId
            ? { firstName: authorId.firstName, lastName: authorId.lastName }
            : { name: authorId.name };

    const variant: Record<Role, { tag: string; style: string }> = {
        ADMIN: { tag: 'Administatrateur', style: 'bg-accent' },
        STUDENT: { tag: 'Étudiant', style: 'bg-primary' },
        COMPANY: { tag: 'Entreprise', style: 'bg-secondary' },
    };
    return (
        <div className="bg-base-100 border border-slate-200 rounded-xl p-4 mb-2 shadow-lg w-full ">
            <div className="flex items-center gap-3 h-full">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                    {displayName.name ? (
                        <div className="h-full w-full flex items-center justify-center  font-bold text-primary-content">
                            {displayName.name?.[0]}
                        </div>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-primary-content font-bold">
                            {displayName.firstName?.[0]}
                            {displayName.lastName?.[0]}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-around h-full">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-primary text-sm">
                            {displayName.name ? displayName.name : `${displayName.firstName} ${displayName.lastName}`}
                        </h4>
                        <span className="text-xs text-primary">
                            {new Date(message.createdAt).toLocaleString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>

                    {message.parentMessageId && (
                        <div className="p-2  border border-black ">
                            <MDEditor.Markdown
                                source={message.parentMessageId.content}
                                className="!bg-transparent !text-base-content !text-sm leading-relaxed"
                                style={{ fontFamily: 'inherit' }}
                            />
                        </div>
                    )}

                    <MDEditor.Markdown
                        source={message.content}
                        className="!bg-transparent !text-base-content !text-sm leading-relaxed"
                        style={{ fontFamily: 'inherit' }}
                    />
                    <div className="flex flex-row gap-2 p-2 justify-between items-center">
                        <button
                            className="flex items-center gap-1 px-3 py-1 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            onClick={() =>
                                onReply?.(
                                    message._id,
                                    displayName.name
                                        ? displayName.name
                                        : `${displayName.firstName} ${displayName.lastName}`,
                                )
                            }
                        >
                            <span className="text-lg leading-none mt-1">“</span> Citer
                        </button>
                        <span className={cn('badge', variant[`${message.authorId.role}`].style)}>
                            {variant[`${message.authorId.role}`].tag}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
