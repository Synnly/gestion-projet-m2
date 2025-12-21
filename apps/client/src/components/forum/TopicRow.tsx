import type { Topic } from '../../types/forum.types.ts';
import { formatNumber } from '../../utils/format.ts';

type Props = {
    topic: Topic;
};

export const TopicRow = ({ topic }: Props) => {
    return (
        <>
            <tr className="list-row hover:bg-base-200 transition-color duration-200 ease-out cursor-pointer">
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
