import type { MessageType } from '../TopicDetailPage';
import { Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import MDEditor from '@uiw/react-md-editor';
type replyMessageProps = {
    replyMessage: MessageType;
};
export const ReplyMessage = ({ replyMessage }: replyMessageProps) => {
    return (
        <div className="flex flex-col border-l-4 border-blue-400 bg-base-200 p-4 rounded-r-lg max-w-2xl font-sans">
            {/* Header : L'auteur et la date */}
            <div className="flex items-center gap-2 mb-2 text-sm text-primary font-medium">
                <Reply size={14} className="transform rotate-180" />
                <span>
                    Réponse à{' '}
                    {replyMessage.authorId
                        ? 'name' in replyMessage.authorId && replyMessage.authorId.name
                            ? replyMessage.authorId.name
                            : 'firstName' in replyMessage.authorId && 'lastName' in replyMessage.authorId
                              ? `${replyMessage.authorId.firstName} ${replyMessage.authorId.lastName}`.trim()
                              : ''
                        : ''}
                </span>
                <span className="text-gray-400 ml-1">•</span>
                <span className="text-gray-500 font-normal">
                    {' '}
                    {formatDistanceToNow(new Date(replyMessage.createdAt), {
                        addSuffix: true,
                        locale: fr,
                    })}
                </span>
            </div>

            <div className="text-gray-700 italic leading-relaxed">
                <MDEditor.Markdown
                    source={replyMessage.content}
                    className="!bg-transparent !text-base-content !text-sm leading-relaxed"
                    style={{ fontFamily: 'inherit' }}
                />
            </div>
        </div>
    );
};
