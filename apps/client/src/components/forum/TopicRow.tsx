import { useNavigate } from 'react-router';
import type { Topic } from '../../types/forum.types.ts';
import { formatNumber } from '../../utils/format.ts';

type Props = {
    topic: Topic;
    companyId?: string;
    forumId: string;
};

export const TopicRow = ({ topic, companyId, forumId }: Props) => {
    const nav = useNavigate();
    const navigateToTopic = () => {
        const link = `/forums/${companyId || 'general'}/topics/${forumId}/${topic._id}`;
        console.log(link);
        nav(link);
    };
    return (
        <>
            <tr
                onClick={navigateToTopic}
                className="list-row hover:bg-base-200 transition-color duration-200 ease-out cursor-pointer"
            >
                <td className="w-px whitespace-nowrap font-medium">{topic.title}</td>
                <td className="truncate max-w-100">{topic.description}</td>
                <td className="w-px whitespace-nowrap">
                    {topic.author.firstName && topic.author.lastName
                        ? topic.author.firstName + ' ' + topic.author.lastName
                        : topic.author.name}
                </td>

                <td className="w-px whitespace-nowrap text-right">
                    {formatNumber(topic.nbMessages) === 'undefined' ? 0 : formatNumber(topic.nbMessages)} messages
                </td>
            </tr>
        </>
    );
};
