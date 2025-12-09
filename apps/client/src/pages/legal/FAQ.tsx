import { Link } from 'react-router-dom';

export default function FAQ() {
    const year = new Date().getFullYear();
    const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string) || 'support@stagera.example';
    const LEGAL_EMAIL = (import.meta.env.VITE_LEGAL_EMAIL as string) || 'legal@stagera.example';
    const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string) || 'contact@stagera.example';

    return (
        <main className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold">FAQ</h1>
                <p className="text-sm text-base-content/70 mt-2">
                    Questions fréquentes — réponses claires et concises.
                </p>
            </header>

            <div className="card bg-base-200 shadow-sm mb-6">
                <div className="card-body">
                    <h2 className="card-title">Besoin d'aide rapidement ?</h2>
                    <p className="text-sm text-base-content/70">
                        Consultez les réponses ci-dessous ou contactez-nous directement :
                        <a className="link link-hover ml-2" href={`mailto:${SUPPORT_EMAIL}`}>
                            {SUPPORT_EMAIL}
                        </a>
                    </p>
                </div>
            </div>

            <section className="space-y-3">
                <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
                    <input type="checkbox" />
                    <div className="collapse-title text-lg font-medium">Comment postuler à une offre ?</div>
                    <div className="collapse-content">
                        <p>
                            Ouvrez l'offre qui vous intéresse et cliquez sur <strong>Postuler</strong>. Suivez les
                            instructions et joignez votre CV et lettre de motivation si demandés.
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
                    <input type="checkbox" />
                    <div className="collapse-title text-lg font-medium">Puis-je modifier mon profil ?</div>
                    <div className="collapse-content">
                        <p>
                            Oui — rendez-vous dans{' '}
                            <Link to="/complete-profil" className="link link-hover">
                                Mon profil
                            </Link>
                            pour mettre à jour vos informations, votre CV et photo.
                        </p>
                    </div>
                </div>

                <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
                    <input type="checkbox" />
                    <div className="collapse-title text-lg font-medium">Comment signaler une offre frauduleuse ?</div>
                    <div className="collapse-content">
                        <p>
                            Nous prenons ces signalements au sérieux. Utilisez le lien{' '}
                            <Link to="/report" className="link link-hover">
                                Signaler un contenu
                            </Link>
                            ou écrivez à
                            <a className="link link-hover ml-1" href={`mailto:${LEGAL_EMAIL}`}>
                                {LEGAL_EMAIL}
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </section>

            <footer className="mt-8 text-sm text-base-content/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <Link to="/contact" className="link link-hover mr-4">
                        Contact
                    </Link>
                    <Link to="/about" className="link link-hover">
                        À propos
                    </Link>
                </div>

                <div className="text-right">
                    <div>
                        Contact général :{' '}
                        <a className="link link-hover" href={`mailto:${CONTACT_EMAIL}`}>
                            {CONTACT_EMAIL}
                        </a>
                    </div>
                    <div className="mt-2">© {year} Stagora — Tous droits réservés.</div>
                </div>
            </footer>
        </main>
    );
}
