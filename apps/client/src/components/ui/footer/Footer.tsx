import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="footer bg-base-200 text-base-content p-6 md:p-8">
            <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            fillRule="evenodd"
                            clipRule="evenodd"
                            className="fill-current text-primary"
                        >
                            <path d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z" />
                        </svg>
                        <div>
                            <div className="font-bold">ACME Industries</div>
                            <div className="text-sm text-base-content/60">Providing reliable tech since 1992</div>
                        </div>
                    </div>

                    <p className="text-sm text-base-content/70 max-w-sm">
                        We connect students and companies through quality internship listings — trusted by thousands of
                        organizations.
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                        <a href="mailto:contact@acme.example" aria-label="Contact email" className="link link-hover">
                            <Mail className="h-5 w-5 inline-block" />
                        </a>
                    </div>
                </div>

                <nav aria-label="Pages" className="space-y-2">
                    <h6 className="footer-title">Pages</h6>
                    <Link to="/" className="link link-hover">
                        Accueil
                    </Link>
                    <Link to="/internships" className="link link-hover">
                        Offres de stage
                    </Link>
                    <Link to="/companies" className="link link-hover">
                        Entreprises
                    </Link>
                    <Link to="/about" className="link link-hover">
                        À propos
                    </Link>
                    <Link to="/contact" className="link link-hover">
                        Contact
                    </Link>
                </nav>

                <nav aria-label="Legal" className="space-y-2">
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

                <nav aria-label="Support" className="space-y-2">
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
