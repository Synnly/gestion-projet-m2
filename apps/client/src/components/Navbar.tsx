import { NavLink } from 'react-router';
import { useEffect, useState } from 'react';
import logo from '../../assets/image1.png';
import { userStore } from '../store/userStore';
import { profileStore } from '../store/profileStore';
import { useBlob } from '../hooks/useBlob';

interface NavbarProps {
    appName?: string;
}

//Navbar seuelemnt pour Company pour le moment
export const Navbar = ({ }: NavbarProps) => {
    // Récupérer le profil de l'entreprise connectée
    const profile = profileStore((state) => state.profile);
    
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

    return (
        <nav className="sticky top-0 z-50 w-full container mx-auto bg-white shadow-sm px-8 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                
                <NavLink
                    to="/"
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                    <img src={logo} alt="Logo" className="h-10" />
                </NavLink>

                
                <div className="flex items-center gap-8 font-medium">
                    <NavLink
                        to="/company/offers"
                        className="hover:text-primary transition-colors"
                    >
                        Les annonces
                    </NavLink>

                    <NavLink
                        to="/company/applications"
                        className="hover:text-primary transition-colors"
                    >
                        Les candidatures
                    </NavLink>
                </div>

               
                <div className="flex items-center gap-4 font-medium">

                    <NavLink
                        to="/company/offers/add"
                        className="btn btn-primary text-black rounded-xl"
                    >
                        Ajouter annonce
                    </NavLink>

                    <div className="dropdown dropdown-end">
                        <div
                            tabIndex={0}
                            role="button"
                            className="btn btn-ghost rounded-xl p-2"
                        >
                            {companyLogoUrl ? (
                                <img 
                                    src={companyLogoUrl} 
                                    alt="Logo entreprise" 
                                    className="h-8 w-8 object-contain rounded"
                                />
                            ) : (
                                <span>Logo Entreprise</span>
                            )}
                        </div>

                        <ul
                            tabIndex={-1}
                            className="menu dropdown-content bg-base-200 rounded-box z-10 mt-4 w-52 p-2 shadow-sm"
                        >
                            <li>
                                <NavLink to="/company/profile">Profil</NavLink>
                            </li>
                            <li><a className='text-red-600'>Se déconnecter</a></li>
                        </ul>
                    </div>
                </div>

            </div>
        </nav>
    );
};
