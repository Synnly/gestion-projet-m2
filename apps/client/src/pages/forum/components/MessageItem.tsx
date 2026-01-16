import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { cn } from '../../../utils/cn';
import type { MessageType, Role } from '../TopicDetailPage';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReplyMessage } from './replyMessage';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { ReportMessageModal } from './ReportMessageModal';
import { userStore } from '../../../store/userStore';

export const MessageItem = ({
    message,
    onReply,
    isHighlighted = false,
    currentUserId,
    reportedMessageIds,
}: {
    message: MessageType;
    onReply?: (id: string, name: string) => void;
    isHighlighted?: boolean;
    currentUserId?: string;
    reportedMessageIds?: Set<string>;
}) => {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const { authorId } = message;
    
    // Vérifier si l'utilisateur est banni
    const isAuthorBanned = !!authorId.ban;
    
    // Vérifier si c'est le propre message de l'utilisateur
    const isOwnMessage = currentUserId && authorId._id === currentUserId;
    
    // Vérifier si le message a déjà été signalé par l'utilisateur
    const isAlreadyReported = reportedMessageIds?.has(message._id);
    
    console.log('MessageItem - message._id:', message._id);
    console.log('MessageItem - isAlreadyReported:', isAlreadyReported);
    console.log('MessageItem - reportedMessageIds:', reportedMessageIds);
    
    // Le bouton de signalement ne s'affiche que si :
    // - L'auteur n'est pas banni
    // - Ce n'est pas le propre message de l'utilisateur
    // - Le message n'a pas déjà été signalé par l'utilisateur
    const showReportButton = !isAuthorBanned && !isOwnMessage && !isAlreadyReported;
    
    const displayName = isAuthorBanned
        ? { name: '[utilisateur supprimé]' }
        : authorId.role === 'ADMIN'
          ? { name: 'Administrateur' }
          : 'firstName' in authorId
            ? { firstName: authorId.firstName, lastName: authorId.lastName }
            : { name: authorId.name };

    const variant: Record<Role, { tag: string; style: string }> = {
        ADMIN: { tag: 'Administrateur', style: 'badge-error' },
        STUDENT: { tag: 'Étudiant', style: 'badge-primary' },
        COMPANY: { tag: 'Entreprise', style: 'badge-secondary' },
    };
    return (
        <div 
            id={`message-${message._id}`}
            className={`bg-base-100 border rounded-xl p-4 mb-2 shadow-lg shadow-base-300 w-full transition-all duration-300 ${
                isHighlighted ? 'border-warning border-2 bg-warning/10' : 'border-base-300'
            }`}
        >
            <div className="flex items-start gap-3 h-full">
                <div className="h-10 w-10 rounded-full  flex-shrink-0 overflow-hidden">
                    {message.authorId.logo ? (
                        <div className="h-full w-full flex items-center justify-center  font-bold text-primary-content ">
                            <img
                                src={message.authorId.logo}
                                alt={displayName.name || `${displayName.firstName} ${displayName.lastName}`}
                            />
                        </div>
                    ) : displayName.name ? (
                        <div className="h-full w-full flex items-center justify-center bg-base-200  font-bold text-primary-content ">
                            {displayName.name?.[0]}
                        </div>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-base-200 text-primary-content font-bold">
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
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-secondary">
                                {formatDistanceToNow(new Date(message.createdAt), {
                                    addSuffix: true,
                                    locale: fr,
                                })}{' '}
                            </span>
                            {showReportButton && (
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="btn btn-ghost btn-xs text-warning hover:text-error"
                                    title="Signaler ce message"
                                >
                                    <AlertTriangle size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {message.parentMessageId && <ReplyMessage replyMessage={message.parentMessageId} />}

                    <MDEditor.Markdown
                        source={isAuthorBanned ? '[message supprimé]' : message.content}
                        className="!bg-transparent !text-base-content !text-sm leading-relaxed"
                        style={{ fontFamily: 'inherit' }}
                    />
                    <div className="flex flex-row gap-2 p-2 justify-between items-center">
                        <button
                            className="btn btn-soft btn-sm"
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

            <ReportMessageModal
                messageId={message._id}
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </div>
    );
};
