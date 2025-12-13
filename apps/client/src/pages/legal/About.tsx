import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function About() {
    const year = new Date().getFullYear();
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL

    return (
        <main className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-8">
                <div className="flex items-center gap-6">
                    <Link to="/" className="btn btn-primary btn-sm rounded-md flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Accueil
                    </Link>

                    <div>
                        <h1 className="text-3xl font-semibold">À propos</h1>
                        <p className="text-sm text-base-content/70 mt-1">Qui nous sommes et pourquoi nous existons.</p>
                    </div>
                </div>
            </header>

            <section className="prose prose-invert mb-6 space-y-6">
                <p>
                    Stagora est une plateforme conçue pour rapprocher étudiants et entreprises autour d'offres de stage
                    pertinentes. Nous croyons que chaque stage est une opportunité d'apprentissage et de découverte
                    professionnelle.
                </p>

                <h2 className="text-lg font-semibold">Nos valeurs</h2>
                <ul>
                    <li>Transparence</li>
                    <li>Qualité</li>
                    <li>Sécurité des données</li>
                </ul>

                <h2 className="text-lg font-semibold">Vous joindre</h2>
                <p>
                    Pour toute demande, écrivez à
                    <a className="link link-hover ml-1" href={`mailto:${contactEmail}`}>
                        {contactEmail}
                    </a>
                    .
                </p>
            </section>

            <footer className="mt-8 text-sm text-base-content/60">
                <Link to="/contact" className="link link-hover mr-4">
                    Contact
                </Link>
                <Link to="/faq" className="link link-hover">
                    FAQ
                </Link>
                <div className="mt-4">© {year} Stagora — Tous droits réservés.</div>
            </footer>
        </main>
    );
}
