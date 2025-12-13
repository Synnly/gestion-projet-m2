import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Logo from '../../icons/Logo';

export default function Footer() {
    const year = new Date().getFullYear();
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL;

    return (
        <footer className="footer bg-base-200 text-base-content p-6 md:p-8">
            <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Link to="/">
                            <Logo />
                        </Link>
                    </div>

                    <p className="text-sm text-base-content/70 max-w-sm">
                        Nous mettons en relation les étudiants et les entreprises grâce à des offres de stage de qualité — approuvé par des milliers d'organisations.
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                        <a href={`mailto:${contactEmail}`} aria-label="Contact email" className="link link-hover">
                            <Mail className="h-5 w-5 inline-block" />
                        </a>
                    </div>
                </div>

                <nav aria-label="Pages" className="space-y-2 flex flex-col">
                    <h6 className="footer-title">Pages</h6>
                    <Link to="/" className="link link-hover">
                        Offres de stage
                    </Link>
                    <Link to="/about" className="link link-hover">
                        À propos
                    </Link>
                    <Link to="/contact" className="link link-hover">
                        Contact
                    </Link>
                </nav>

                <nav aria-label="Legal" className="space-y-2 flex flex-col">
                    <h6 className="footer-title">Legal</h6>
                    <Link to="/terms" className="link link-hover">
                        Conditions d'utilisation
                    </Link>
                    <Link to="/privacy" className="link link-hover">
                        Politique de confidentialité
                    </Link>
                    <Link to="/cookies" className="link link-hover">
                        Politique des cookies
                    </Link>
                    <Link to="/safety" className="link link-hover">
                        Sécurité & conformité
                    </Link>
                </nav>

                <nav aria-label="Support" className="space-y-2 flex flex-col">
                    <h6 className="footer-title">Support</h6>
                    <Link to="/faq" className="link link-hover">
                        FAQ
                    </Link>
                    <Link to="/help" className="link link-hover">
                        Centre d'aide
                    </Link>
                    <Link to="/report" className="link link-hover">
                        Signaler un contenu
                    </Link>
                </nav>
            </div>

            <div className="container mx-auto mt-6 border-t border-base-300 pt-4 text-sm text-base-content/60 flex flex-col md:flex-row items-center justify-between gap-2">
                <div>© {year} Stagora — Tous droits réservés.</div>

                <div className="flex items-center gap-4">
                    <Link to="/terms" className="link link-hover">
                        Conditions
                    </Link>
                    <Link to="/privacy" className="link link-hover">
                        Confidentialité
                    </Link>
                    <Link to="/cookies" className="link link-hover">
                        Cookies
                    </Link>
                </div>
            </div>
        </footer>
    );
}
