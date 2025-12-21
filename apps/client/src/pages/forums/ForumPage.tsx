import { useNavigation } from 'react-router-dom';
import { useParams } from 'react-router';
import { Navbar } from '../../components/navbar/Navbar.tsx';
import Spinner from '../../components/Spinner/Spinner.tsx';
import { useFetchForumByCompanyId, useFetchGeneralForum } from '../../hooks/useFetchForum.ts';
import { ForumHeader } from '../../components/forum/ForumHeader.tsx';

type Props = {
    isGeneral?: boolean;
};

export function ForumPage({ isGeneral = false }: Props) {
    const navigation = useNavigation();
    const companyId = useParams().companyId!;
    let forum;
    let isLoading: boolean;

    if (isGeneral) {
        let { data, isLoading: isLoadingTmp } = useFetchGeneralForum();
        forum = data;
        isLoading = isLoadingTmp;
    } else {
        let { data, isLoading: isLoadingTmp } = useFetchForumByCompanyId(companyId);
        forum = data;
        isLoading = isLoadingTmp;
    }

    return (
        <div className="flex flex-col h-screen">
            <Navbar minimal={false} />
            <Spinner show={navigation.state === 'loading'} />
            {!isLoading && (
                <div className="flex flex-col justify-center p-8 px-80">
                    <div className="breadcrumbs text-sm">
                        <ul>
                            <li>
                                <a href="/forums">Forums</a>
                            </li>
                            <li>{forum?.company?.name ?? 'Général'}</li>
                        </ul>
                    </div>
                    {forum && <ForumHeader forum={forum} />}
                </div>
            )}
        </div>
    );
}
