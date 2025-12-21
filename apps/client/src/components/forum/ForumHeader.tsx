import logoPlaceholder from '../../../assets/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg';
import { formatNumber } from '../../utils/format.ts';
import { Pencil } from 'lucide-react';
import type { Forum } from '../../types/forum.types.ts';

type Props = {
    forum: Forum;
};

export const ForumHeader = ({ forum }: Props) => {
    return (
        <div className="flex flex-col justify-center gap-8">
            <div className="card bg-base-100 shadow-sm shadow-base-300">
                <div className="card-body flex flex-row justify-between items-center">
                    <div className="flex flex-row items-center gap-4">
                        {forum.company && (
                            <div className="avatar">
                                <div className="w-14 rounded">
                                    <img src={forum.company?.logo ?? logoPlaceholder} alt={forum.company?.name} />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col">
                            <div className="text-4xl font-bold">{forum.company?.name ?? 'Forum général'}</div>
                            {forum.company && (
                                <div className="flex items-center">
                                    {forum.company?.city}, {forum.company?.country}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-row items-center gap-8">
                        <div className="flex flex-col items-center">
                            <div className="text-2xl font-bold">
                                {forum.nbTopics ? formatNumber(forum.nbTopics) : 0}
                            </div>
                            <div>sujets</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-2xl font-bold">
                                {forum.nbMessages ? formatNumber(forum.nbMessages) : 0}
                            </div>
                            <div>messages</div>
                        </div>
                        <div>
                            <button className="btn btn-primary">
                                <Pencil />
                                Nouveau sujet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
