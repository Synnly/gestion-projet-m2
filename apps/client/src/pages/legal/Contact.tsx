import { Link } from 'react-router-dom';

export default function Contact() {
    const year = new Date().getFullYear();

    return (
        <main className="max-w-3xl mx-auto py-12 px-6">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold">Contact</h1>
                <p className="text-sm text-base-content/70 mt-2">Nous sommes à votre écoute.</p>
            </header>

            <section className="prose prose-invert mb-6 space-y-6">
                <p>Pour toute question, suggestion ou demande de partenariat, contactez notre équipe :</p>

                <ul>
                    <li>
                        Support général :
                        <a className="link link-hover ml-1" href="mailto:support@stagera.example">
                            support@stagera.example
                        </a>
                    </li>
                    <li>
                        Questions juridiques :
                        <a className="link link-hover ml-1" href="mailto:legal@stagera.example">
                            legal@stagera.example
                        </a>
                    </li>
                </ul>

                <h2 className="text-lg font-semibold">Formulaire rapide</h2>
                <p className="text-sm text-base-content/70">(Pour l'instant, utilisez l'adresse email ci-dessus.)</p>
            </section>

            <footer className="mt-8 text-sm text-base-content/60">
                <Link to="/faq" className="link link-hover mr-4">
                    FAQ
                </Link>
                <Link to="/about" className="link link-hover">
                    À propos
                </Link>
                <div className="mt-4">© {year} Stagora — Tous droits réservés.</div>
            </footer>
        </main>
    );
}
