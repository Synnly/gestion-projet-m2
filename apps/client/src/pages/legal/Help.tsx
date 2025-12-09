import { Link } from 'react-router-dom';

export default function Help() {
    const year = new Date().getFullYear();

    return (
        <main className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold">Centre d'aide</h1>
                <p className="text-sm text-base-content/70 mt-2">Guide rapide et ressources d'assistance.</p>
            </header>

            <section className="prose prose-invert mb-6 space-y-6">
                <h2 className="text-lg font-semibold">Ressources</h2>
                <ul>
                    <li>
                        Consultez la{' '}
                        <Link to="/faq" className="link link-hover">
                            FAQ
                        </Link>{' '}
                        pour les réponses rapides.
                    </li>
                    <li>
                        Pour une aide personnalisée, contactez{' '}
                        <a className="link link-hover" href="mailto:support@stagera.example">
                            support@stagera.example
                        </a>
                        .
                    </li>
                </ul>

                <h2 className="text-lg font-semibold">Guides</h2>
                <p>
                    Nous préparons des guides pratiques (CV, préparation entretien, rédaction de candidatures) — bientôt
                    disponibles.
                </p>
            </section>

            <footer className="mt-8 text-sm text-base-content/60">
                <Link to="/faq" className="link link-hover mr-4">
                    FAQ
                </Link>
                <Link to="/contact" className="link link-hover">
                    Contact
                </Link>
                <div className="mt-4">© {year} Stagora — Tous droits réservés.</div>
            </footer>
        </main>
    );
}
