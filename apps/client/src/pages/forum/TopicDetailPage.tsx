import { useParams, Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchTopicById } from '../../api/fetch_topic';
import { Navbar } from '../../components/navbar/Navbar';
import { TopicHeaderSkeleton } from './components/Skeleton';
import type { Topic } from './types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { MessageSender } from './components//MessageSender';
import { MessageContainer } from './components//MessageContainer';
import { MessageItem } from './components//MessageItem.tsx';
import { DataPagination } from '../../components/ui/pagination/DataPagination.tsx';
import { UseAuthFetch } from '../../hooks/useAuthFetch.tsx';
import { buildQueryParams } from '../../hooks/useFetchInternships.ts';
import type { PaginationResult } from '../../types/internship.types.ts';
export type Role = 'ADMIN' | 'STUDENT' | 'COMPANY';
export type MessageType = {
    _id: string;
    topicId: string;
    authorId: { logo: string; role: Role } & ({ firstName: string; lastName: string } | { name: string });
    parentMessageId?: MessageType;
    content: string;
    createdAt: Date;
};
const apiUrl = import.meta.env.VITE_APIURL;
export default function TopicDetailPage() {
    const authFetch = UseAuthFetch();
    const { forumId, topicId, companyId } = useParams<{ forumId: string; topicId: string; companyId: string }>();

    const [filter, setFilter] = useState({
        page: 1,
        limit: 10,
    });
    const {
        data,
        isLoading: messageIsLoading,
        isError: messageIsError,
        isPlaceholderData,
        refetch: messageRefetch,
    }: {
        data: PaginationResult<MessageType> | undefined;
        isError: boolean;
        isLoading: boolean;
        isPlaceholderData: boolean;
        refetch: any;
    } = useQuery({
        queryKey: ['topicMessages', topicId, filter],
        queryFn: async () => {
            const param = buildQueryParams(filter);
            const response = await authFetch(`${apiUrl}/api/forum/topic/${topicId}/message?${param}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            return response.json();
        },
        placeholderData: keepPreviousData,
    });

    const {
        data: companyData,
        isLoading: isCompanyLoading,
        isError: isCompanyError,
    } = useQuery({
        queryKey: ['companyTopic', companyId],
        queryFn: async () => {
            const companyInformation = await authFetch(`${apiUrl}/api/companies/${companyId}`, { method: 'GET' });
            if (!companyInformation.ok) {
                return null;
            }
            return await companyInformation.json();
        },
        enabled: !!companyId,
    });
    console.log(companyData);
    const {
        data: topic,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
    } = useQuery<Topic | null, Error>({
        queryKey: ['topic', forumId, topicId],
        queryFn: () => fetchTopicById(forumId!, topicId!),
        enabled: !!forumId && !!topicId,
        staleTime: 30 * 1000,
    });
    const [shown, setShown] = useState(false);

    const [reply, setReply] = useState<{ id: string; name: string } | null>(null);

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

    const handleRefresh = async () => {
        try {
            await refetch();
            await messageRefetch();
            toast.success('Messages actualisés', { autoClose: 2000 });
        } catch (err) {
            toast.error("Erreur lors de l'actualisation");
        }
    };

    const afterSend = async () => {
        await refetch();
        await messageRefetch();
        toggleSender();
        setReply;
    };
    if (!forumId || !topicId) {
        return (
            <div className="h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 w-full flex flex-col mx-auto max-w-5xl px-4 py-6 overflow-hidden">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-base-content mb-2">Paramètres manquants</h2>
                        <p className="text-base-content/70 mb-6">
                            Les identifiants du forum ou du topic sont manquants.
                        </p>
                        <Link to="/" className="btn btn-primary">
                            Retour à l'accueil
                        </Link>
                    </div>
                </main>
            </div>
        );
    }
    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={false} />

            <div className="flex flex-col flex-1 overflow-hidden duration-500 w-full max-w-5xl mx-auto p-4 gap-2 ">
                <div className="mb-6 flex items-center justify-between">
                    <div className="text-sm breadcrumbs">
                        <ul>
                            <li>
                                <Link to="/">Accueil</Link>
                            </li>
                            <li>
                                <Link to="/forums">Forums</Link>
                            </li>
                            <li>
                                {(companyData || !companyId) && (
                                    <Link to={`/forums/${companyId || 'general'}`}>
                                        {companyId ? companyData.name : 'Generale'}
                                    </Link>
                                )}
                            </li>
                            {!isLoading && (
                                <li>{`${topic?.title.charAt(0).toUpperCase()}${topic?.title.substring(1)}`}</li>
                            )}
                        </ul>
                    </div>
                    <button onClick={handleRefresh} disabled={isRefetching} className="btn btn-ghost btn-sm gap-2">
                        <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
                        Actualiser
                    </button>
                </div>
                {isLoading && (
                    <div className="card bg-base-200 shadow-lg">
                        <div className="card-body">
                            <TopicHeaderSkeleton />
                            <div className="divider"></div>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-12 bg-base-300 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {isError && (
                    <div className="card bg-error/10 border border-error/20 shadow-lg">
                        <div className="card-body text-center">
                            <h2 className="card-title text-error justify-center">Erreur lors du chargement</h2>
                            <p className="text-base-content/70">
                                {error?.message || 'Impossible de charger ce topic.'}
                            </p>
                            <div className="card-actions justify-center mt-4">
                                <button onClick={handleRefresh} className="btn btn-primary">
                                    Réessayer
                                </button>
                                <Link to="/" className="btn btn-ghost">
                                    Retour à l'accueil
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
                {!topic ? (
                    <div className="card bg-base-200 shadow-lg">
                        <div className="card-body text-center">
                            <h2 className="card-title justify-center">Topic introuvable</h2>
                            <p className="text-base-content/70">Ce topic n'existe pas ou a été supprimé.</p>
                            <div className="card-actions justify-center mt-4">
                                <Link to="/" className="btn btn-primary">
                                    Retour à l'accueil
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card bg-base-100 shadow-lg mb-2 flex flex-col gap-2 ">
                        <div className="card-body">
                            <div className="flex items-center gap-3 text-sm text-base-content/70 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="avatar placeholder">
                                        <div className="text-neutral-content bg-black flex justify-center items-center rounded-full w-10 h-10">
                                            {topic.author.logo ? (
                                                <img
                                                    src={topic.author.logo}
                                                    alt={
                                                        topic.author.name ||
                                                        `${topic.author.firstName} ${topic.author.lastName}`
                                                    }
                                                />
                                            ) : (
                                                <span className="text-lg font-bold">
                                                    {(
                                                        topic.author.name?.charAt(0) ||
                                                        topic.author.firstName?.charAt(0)
                                                    )?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-medium text-base-content">
                                        {topic.author.firstName && topic.author.lastName
                                            ? topic.author.firstName + ' ' + topic.author.lastName
                                            : topic.author.name}{' '}
                                    </span>
                                </div>
                                <span>•</span>
                                <span>
                                    {topic.createdAt &&
                                        formatDistanceToNow(new Date(topic.createdAt), {
                                            addSuffix: true,
                                            locale: fr,
                                        })}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <MessageSquare size={14} />
                                    {topic.messages?.length || 0} message
                                    {(topic.messages?.length || 0) > 1 ? 's' : ''}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-base-content mb-4">{`${topic?.title.charAt(0).toUpperCase()}${topic?.title.substring(1)}`}</h1>
                            {topic.description && (
                                <div className="prose max-w-none">
                                    <p className="text-base-content/90 whitespace-pre-wrap">{topic.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
                <div className=" card bg-base-100 shadow-lg flex flex-col overflow-hidden border border-slate-200 ">
                    {!topic?.messages || topic?.messages.length === 0 ? (
                        <div className="card text-center py-12 text-base-content/60">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucun message pour le moment</p>
                            <p className="text-sm mt-2">Soyez le premier à participer à cette discussion !</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto w-full p-2 flex flex-col items-center ">
                                <MessageContainer className="w-full">
                                    {data &&
                                        data.data.map((message: MessageType) => (
                                            <MessageItem key={message._id} message={message} onReply={onReply} />
                                        ))}
                                </MessageContainer>
                            </div>

                            <DataPagination<MessageType> pagination={data} handlePageChange={handlePageChange} />
                        </>
                    )}
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
        </div>
    );
}
