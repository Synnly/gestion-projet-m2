import { NavLink, useNavigation, useParams } from 'react-router';
import { Navbar } from '../../../components/navbar/Navbar';
import Spinner from '../../../components/Spinner/Spinner';
import { useState } from 'react';
import { UseAuthFetch } from '../../../hooks/UseAuthFetch';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationResult } from '../../../types/internship.types';
import { MessageContainer } from './MessageContainer';
import { MessageItem } from './MessageItem';
import { MessageSender } from './MessageSender';
import { cn } from '../../../utils/cn';
import { DataPagination } from '../../../components/ui/pagination/DataPagination';
const apiUrl = import.meta.env.VITE_APIURL;

export type Role = 'ADMIN' | 'STUDENT' | 'COMPANY';
export type MessageType = {
    _id: string;
    topicId: string;
    author: { logo: string; role: Role } & ({ firstName: string; lastName: string } | { name: string });
    parentMessage?: MessageType;
    content: string;
    createdAt: Date;
};
export const MessageTopicPage = () => {
    const navigation = useNavigation();
    const { companyId, topicId } = useParams();
    const isGeneral = !companyId;
    const client = useQueryClient();
    const [shown, setShown] = useState(false);
    const [filter, setFilter] = useState({
        page: 1,
        limit: 10,
    });
    const [reply, setReply] = useState<{ id: string; name: string } | null>(null);
    const afterSend = () => {
        client.invalidateQueries({ queryKey: ['topicMessages', topicId, filter] });
        setShown(false);
        setReply(null);
    };
    const authFetch = UseAuthFetch();
    /** plug les messages */
    const {
        data,
        isLoading,
        isError,
        isPlaceholderData,
    }: {
        data: PaginationResult<MessageType> | undefined;
        isError: boolean;
        isLoading: boolean;
        isPlaceholderData: boolean;
    } = useQuery({
        queryKey: ['topicMessages', topicId, filter],
        queryFn: async () => {
            const response = await authFetch(`${apiUrl}/forum/topic/${topicId}/message`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                data: filter,
            });
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            return response.json();
        },
        placeholderData: keepPreviousData,
        enabled: false,
    });
    const toggleSender = () => setShown(!shown);
    const onCancel = () => {
        setShown(false);
        setReply(null);
    };
    const onReply = (id: string, name: string) => {
        setReply({ id, name });
        setShown(true);
    };
    const onCancelReply = () => {
        setReply(null);
    };
    const handlePageChange = (newPage: number) => {
        setFilter((prev) => ({ ...prev, page: newPage }));
    };
    const mockMessages = [
        {
            _id: '1',
            topicId: 'topic1',
            author: { firstName: 'John', lastName: 'Doe', logo: 'logo1.png', role: 'STUDENT' as Role },
            content:
                'HHello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.ello, this is a message from John.',

            createdAt: new Date(),
        },

        {
            _id: '7',
            topicId: 'topic1',
            author: { firstName: 'John', lastName: 'Doe', logo: 'logo1.png', role: 'STUDENT' as Role },
            content:
                'HHello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.Hello, this is a message from John.ello, this is a message from John.',

            createdAt: new Date(),
        },
        {
            _id: '2',
            topicId: 'topic1',
            author: { firstName: 'John', lastName: 'Doe', logo: 'logo1.png', role: 'STUDENT' as Role },
            content: 'Hello, this is a message from John.',
            createdAt: new Date(),
        },
        {
            _id: '3',
            topicId: 'topic1',
            author: { firstName: 'John', lastName: 'Doe', logo: 'logo1.png', role: 'STUDENT' as Role },
            content: 'Hello, this is a message from John.',
            createdAt: new Date(),
        },
        {
            _id: '4',
            topicId: 'topic1',
            author: { firstName: 'John', lastName: 'Doe', logo: 'logo1.png', role: 'COMPANY' as Role },
            content: 'This is a message from Company A.',
            createdAt: new Date(),
        },
    ];
    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={false} />
            <Spinner show={navigation.state === 'loading'} />

            <div className="flex flex-col flex-1 overflow-hidden duration-500 w-full max-w-5xl mx-auto p-4">
                <div className=" p-4 breadcrumbs text-sm">
                    <ul>
                        <li>
                            <NavLink to="/forums">Forums</NavLink>
                        </li>
                        <li>
                            {/*                             TODO: fetch company title */}
                            {isGeneral ? (
                                <NavLink to={`/forums/general`}>Général</NavLink>
                            ) : (
                                <NavLink to={`/forums/${companyId}`}>{`${companyId}`}</NavLink>
                            )}
                        </li>
                        <li>
                            {/*                             TODO : fetch topic title */}
                            <NavLink to="#">{`Sujet ${topicId}`}</NavLink>
                        </li>
                    </ul>
                </div>
                <div className="flex justify-center pb-2">
                    <button
                        onClick={toggleSender}
                        className={cn(
                            'btn btn-primary btn-outline gap-2 rounded-full px-8 shadow-sm transition-all duration-400 ease-in-out',
                            !shown ? 'btn-active' : 'opacity-0',
                        )}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Répondre au sujet
                    </button>
                </div>
                <MessageContainer className="flex-1 overflow-y-auto w-full flex flex-col items-center">
                    {mockMessages.map((message: MessageType) => (
                        <MessageItem key={message._id} message={message} onReply={onReply} />
                    ))}
                </MessageContainer>
                <DataPagination<MessageType> pagination={data} handlePageChange={handlePageChange} />
                <MessageSender
                    topicId={topicId}
                    reply={reply}
                    shown={shown}
                    afterSend={afterSend}
                    onCancel={onCancel}
                    cancelReply={onCancelReply}
                />
            </div>
        </div>
    );
};
