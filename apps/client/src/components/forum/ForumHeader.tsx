import type { Forum } from '../../types/forum.types.ts';
import { formatNumber } from '../../utils/format.ts';

type Props = {
    forum: Forum;
};

export function ForumHeader({ forum }: Props) {
    return (
        <div className="card bg-base-100 shadow-sm shadow-base-300 hover:shadow-md hover:bg-base-200 transition-all duration-100 ease-out cursor-pointer">
            <div className="card-body flex flex-row justify-between items-center">
                <div className="flex flex-row items-center gap-4">
                    <div className="avatar">
                        <div className="w-10 rounded">
                            <img src={forum.company?.logo} alt={forum.company?.name} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-xl font-bold">{forum.company?.name}</div>
                        <div className="flex items-center">
                            {forum.company?.city}, {forum.company?.country}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-4">
                    <div className="flex flex-col items-center">
                        <div className="text-lg font-bold">{forum.nbTopics ? formatNumber(forum.nbTopics) : 0}</div>
                        <div>sujets</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-lg font-bold">{forum.nbMessages ? formatNumber(forum.nbMessages) : 0}</div>
                        <div>messages</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
