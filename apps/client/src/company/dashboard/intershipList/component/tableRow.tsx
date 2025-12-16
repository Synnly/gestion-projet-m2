import EditPencilIcon from '../../../../components/icons/EditPencilIcon';
import type { Internship } from '../../../../types/internship.types';
import { NavLink } from 'react-router-dom';

export const formatDate = (timeStamp: string) => {
    const date = new Date(timeStamp);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export function TableRow({ internship }: { internship: Internship }) {
    return (
        <tr className="border-t border-t-slate-200 dark:border-t-slate-800">
            <td className="px-4 py-2 text-color-accent text-center text-sm font-medium">
                <div className="flex flex-col items-center gap-1">
                    <NavLink to={`/internship/detail/${internship._id}`}>
                        <div>{internship.title}</div>
                    </NavLink>

                    <div className="text-xs flex flex-row items-center gap-2">
                        <span>{internship.sector}</span>
                        <div className={`size-1 rounded-full bg-green-500`} />

                        <span>{internship.adress}</span>
                    </div>
                </div>
            </td>
            <td className=" px-4 py-2 text-slate-600 text-center text-sm">
                <NavLink
                    className="text-color-accent hover:underline text-center"
                    to={`/company/dashboard/post/${internship._id}/applications`}
                >
                    {internship.applications?.length ? `${internship.applications.length} candidature${internship.applications.length > 1 ? 's' : ''}` : 'Aucune candidature'}
                </NavLink>
            </td>

            <td className="h-[72px] px-4 py-2  text-center text-sm">
                <p className="text-color-red">{formatDate(internship.createdAt)}</p>
            </td>

            <td className=" px-4 py-2 text-center">
                <div className="flex items-center justify-center gap-2">
                    <div className={`size-2 rounded-full ${internship.isVisible ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-color-accent">
                        {internship.isVisible ? 'Visible' : 'Masquée'}
                    </span>
                </div>
            </td>

            <td className=" px-4 py-2 text-center">
                <div className="flex items-center justify-center gap-2 ">
                    <button className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <NavLink to={`/company/offers/${internship._id}/edit`}>
                            <EditPencilIcon size={30} />
                        </NavLink>
                    </button>
                </div>
            </td>
        </tr>
    );
}
