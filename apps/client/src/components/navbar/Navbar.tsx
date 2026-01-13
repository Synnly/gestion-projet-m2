import { useEffect, useState } from 'react';
import { profileStore } from '../../store/profileStore';
import { useBlob } from '../../hooks/useBlob';
import Logo from '../icons/Logo';
import { User } from 'lucide-react';
import { centerNavItems, rightNavItems, ItemLink } from './items';
import { userStore } from '../../store/userStore';
import { ToggleDarkMode } from '../darkMode/darkModeToggle';
import { NotificationBell } from '../notifications/NotificationBell';
interface NavbarProps {
    appName?: string;
    /** If true, render only the logo/link */
    minimal?: boolean;
}

//Navbar seulement pour Company pour le moment
export const Navbar = ({ minimal = false }: NavbarProps) => {
    // Récupérer le profil de l'entreprise connectée
    const profile = profileStore((state) => state.profile);
    const user = userStore((state) => state.access);
    const get = userStore((state) => state.get);
    // Récupérer le logo depuis MinIO
    const logoBlob = useBlob(profile?.logo ?? '');
    const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

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
                    <div className="flex flex-row gap-2">
                        <ItemLink
                            item={{ key: 'signin', title: 'Se connecter', to: '/signin' }}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        />
                        <ToggleDarkMode />
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="sticky top-0 z-50 w-full mx-auto bg-base-100 text-base-content px-8 py-2 border-b-2 border-base-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <ItemLink
                    item={{ key: 'home', title: <Logo className="text-primary" />, to: '/' }}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                />

                <div className="flex items-center gap-8 font-medium">
                    {centerNavItems.map((item) => {
                        const role = get(user!)?.role;
                        return role && item.role?.includes(role) && <ItemLink key={item.key} item={item} />;
                    })}
                </div>

                <div className="flex items-center gap-4 font-medium">
                    {rightNavItems.map((item) => {
                        if (item.type === 'button') {
                            const role = get(user!)?.role;
                            return role && item.role?.includes(role) && <ItemLink key={item.key} item={item} />;
                        }

                        // Profile dropdown (keeps previous logic for logo/menu)
                        if (item.type === 'dropdown') {
                            return (
                                <div key={item.key} className="dropdown dropdown-end">
                                    <div tabIndex={0} role="button" className="btn btn-ghost rounded- p-2 text-neutral">
                                        {companyLogoUrl ? (
                                            <img
                                                src={companyLogoUrl}
                                                alt="Logo entreprise"
                                                className="h-8 w-8 object-contain rounded"
                                            />
                                        ) : (
                                            <User className="size-7 text-primary" />
                                        )}
                                    </div>

                                    <ul
                                        tabIndex={-1}
                                        className="menu dropdown-content bg-base-100 rounded-box z-10 mt-4 p-2 shadow-sm"
                                    >
                                        {item.children?.map((child) => {
                                            const role = get(user!)?.role;
                                            return (
                                                role &&
                                                child.role?.includes(role) && (
                                                    <li key={child.key} className="min-w-max">
                                                        {child.to ? (
                                                            <ItemLink item={child} className={child.className ?? ''} />
                                                        ) : (
                                                            <a className={`${child.className ?? ''}`}>{child.title}</a>
                                                        )}
                                                    </li>
                                                )
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        }

                        // Fallback for any plain link-type item
                        return <ItemLink key={item.key} item={item} />;
                    })}
                    <NotificationBell />
                    <ToggleDarkMode />
                </div>
            </div>
        </nav>
    );
};
