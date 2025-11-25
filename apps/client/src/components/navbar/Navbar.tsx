import { useEffect, useState } from 'react';
import placeHolderLogo from '../../../assets/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg';
import { profileStore } from '../../store/profileStore';
import { useBlob } from '../../hooks/useBlob';
import Logo from '../icons/Logo';
import { centerNavItems, rightNavItems, ItemLink } from './items';
import { userStore } from '../../store/userStore';

interface NavbarProps {
    appName?: string;
    /** If true, render only the logo/link */
    minimal?: boolean;
}

//Navbar seulement pour Company pour le moment
export const Navbar = ({ minimal = false }: NavbarProps) => {
    // Récupérer le profil de l'entreprise connectée
    const profile = profileStore((state) => state.profile);

    // Récupérer le logo depuis MinIO
    const logoBlob = useBlob(profile?.logo ?? '');
    const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
    const user = userStore((state) => state.access);
    const userInfo = userStore((state) => state.get)(user);
    useEffect(() => {
        if (!logoBlob) {
            setCompanyLogoUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(logoBlob);
        setCompanyLogoUrl(objectUrl);
        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [logoBlob]);

    if (minimal) {
        return (
            <nav className="sticky top-0 z-50 w-full mx-auto bg-base-100 text-base-content px-8 py-2">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <ItemLink
                        item={{ key: 'home', title: <Logo className="text-primary" />, to: '/' }}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    />
                    <ItemLink
                        item={{ key: 'home', title: <p>Se connecter</p>, to: '/signin' }}
                        className="flex items-center justify-self-end gap-3 hover:opacity-80 transition-opacity"
                    />
                </div>
            </nav>
        );
    }

    return (
        <nav className="sticky top-0 z-50 w-full mx-auto bg-base-100 text-base-content px-8 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <ItemLink
                    item={{ key: 'home', title: <Logo className="text-primary" />, to: '/' }}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                />

                <div className="flex items-center gap-8 font-medium">
                    {centerNavItems.map(
                        (item) =>
                            userInfo?.role &&
                            item.role?.includes(userInfo?.role) && <ItemLink key={item.key} item={item} />,
                    )}
                </div>

                <div className="flex items-center gap-4 font-medium">
                    {rightNavItems.map((item) => {
                        if (item.role && userInfo?.role && !item.role.includes(userInfo?.role)) return;
                        if (item.type === 'button') {
                            return <ItemLink key={item.key} item={item} className="btn btn-primary" />;
                        }

                        // Profile dropdown (keeps previous logic for logo/menu)
                        if (item.type === 'dropdown') {
                            return (
                                <div key={item.key} className="dropdown dropdown-end">
                                    <div
                                        tabIndex={0}
                                        role="button"
                                        className="btn btn-ghost rounded-xl p-2 text-neutral"
                                    >
                                        <img
                                            src={companyLogoUrl ?? placeHolderLogo}
                                            alt="Logo entreprise"
                                            className="h-8 w-8 object-contain rounded"
                                        />
                                    </div>

                                    <ul
                                        tabIndex={-1}
                                        className="menu dropdown-content bg-base-100 rounded-box z-10 mt-4 w-52 p-2 shadow-sm"
                                    >
                                        {item.children?.map((child) => (
                                            <li key={child.key}>
                                                {child.to ? (
                                                    <ItemLink item={child} className={child.className ?? ''} />
                                                ) : (
                                                    <a className={child.className ?? ''}>{child.title}</a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        }

                        // Fallback for any plain link-type item
                        return <ItemLink key={item.key} item={item} />;
                    })}
                </div>
            </div>
        </nav>
    );
};
