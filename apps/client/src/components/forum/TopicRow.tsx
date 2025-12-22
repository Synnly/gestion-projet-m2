import { useNavigate } from 'react-router';
import type { Topic } from '../../types/forum.types.ts';
import { formatNumber } from '../../utils/format.ts';

type Props = {
    topic: Topic;
    companyId: string;
    forumId: string;
};

export const TopicRow = ({ topic, companyId, forumId }: Props) => {
    const nav = useNavigate();
    const navigateToTopic = () => {
        nav(`/forums/${companyId}/topics/${forumId}/${topic._id}`);
    }
    return (
        <>
            <tr onClick={navigateToTopic} className="list-row hover:bg-base-200 transition-color duration-200 ease-out cursor-pointer">
                <td className="w-px whitespace-nowrap font-medium">{topic.title}</td>
                <td className="truncate max-w-100">{topic.description}</td>
                <td className="w-px whitespace-nowrap">
                    {topic.author.firstName} {topic.author.lastName}
                </td>

                <td className="w-px whitespace-nowrap text-right">{formatNumber(topic.nbMessages)} messages</td>
            </tr>
        </>
    );
};
