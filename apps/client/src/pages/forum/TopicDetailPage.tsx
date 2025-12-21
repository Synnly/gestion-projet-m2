import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchTopicById } from '../../api/fetch_topic';
import { Navbar } from '../../components/navbar/Navbar';
import { TopicHeaderSkeleton } from './components/Skeleton';
import type { Topic } from './types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TopicDetailPage() {
    const { forumId, topicId } = useParams<{ forumId: string; topicId: string }>();

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
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true,
    });

    const handleRefresh = async () => {
        try {
            await refetch();
            toast.success('Messages actualisés', { autoClose: 2000 });
        } catch (err) {
            toast.error("Erreur lors de l'actualisation");
        }
    };

    if (!forumId || !topicId) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-8">
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
        <div className="min-h-screen flex flex-col bg-base-100">
            <Navbar />

            <main className="flex-1 w-full mx-auto max-w-5xl px-4 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="text-sm breadcrumbs">
                        <ul>
                            <li>
                                <Link to="/">Accueil</Link>
                            </li>
                            <li>
                                <Link to="/">Forum</Link>
                            </li>
                            <li className="text-base-content/60">Sujet</li>
                        </ul>
                    </div>
                    <button onClick={handleRefresh} disabled={isRefetching} className="btn btn-ghost btn-sm gap-2">
                        <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
                        Actualiser
                    </button>
                </div>

                {isLoading ? (
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
                ) : isError ? (
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
                ) : !topic ? (
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
                    <div className="space-y-6">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <div className="flex items-center gap-3 text-sm text-base-content/70 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="avatar placeholder">
                                            <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                                                {topic.author.avatar ? (
                                                    <img src={topic.author.avatar} alt={topic.author.name} />
                                                ) : (
                                                    <span className="text-xs">
                                                        {topic.author.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-medium text-base-content">{topic.author.name}</span>
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

                                <h1 className="text-3xl font-bold text-base-content mb-4">{topic.title}</h1>

                                {topic.description && (
                                    <div className="prose max-w-none">
                                        <p className="text-base-content/90 whitespace-pre-wrap">{topic.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                {!topic.messages || topic.messages.length === 0 ? (
                                    <div className="text-center py-12 text-base-content/60">
                                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Aucun message pour le moment</p>
                                        <p className="text-sm mt-2">
                                            Soyez le premier à participer à cette discussion !
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2"></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
