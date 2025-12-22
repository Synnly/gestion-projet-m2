import { useNavigation, useParams } from 'react-router';
import { Navbar } from '../../../components/navbar/Navbar';
import Spinner from '../../../components/Spinner/Spinner';
import { useState } from 'react';

export const messageTopicPage = () => {
    const navigation = useNavigation();
    const { topicId } = useParams(); // TODO: Récupérer l'ID du topic depuis les paramètres de l'URL ou le contexte
    const [filter, setFilter] = useState({
        page: 1,
        limit: 10,
    });
    const authFetch = UseAuthFetch();
    const messages = useQuery(['messages', topicId, filter], () =>{
                return fetch(`/api/forums/topics/${topicId}/messages?page=${filter.page}&limit=${filter.limit}`).then(res => res.json());
    }
    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={false} />
            <Spinner show={navigation.state === 'loading'} />
            <div className="flex flex-col justify-center gap-8 p-8">
                <div className="flex flex-col items-center"></div>
            </div>
        </div>
    );
};
