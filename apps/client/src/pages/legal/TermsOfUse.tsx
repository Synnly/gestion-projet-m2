import { Link } from 'react-router-dom';

export default function TermsOfUse() {
    const year = new Date().getFullYear();
    const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <main className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold">Conditions d'utilisation</h1>
                <p className="text-sm text-base-content/70 mt-2">Dernière mise à jour : {today}</p>
            </header>

            <section className="prose prose-invert mb-6 space-y-6">
                <p>
                    Bienvenue sur Stagora. En accédant et en utilisant ce site, vous acceptez d'être lié par les
                    présentes conditions d'utilisation et toutes les lois et réglementations applicables. Si vous
                    n'acceptez pas ces conditions, vous ne devez pas utiliser ce site.
                </p>

                <h2 className="text-lg font-semibold">1. Description du service</h2>
                <p>
                    Stagora fournit une plateforme de mise en relation entre étudiants et entreprises pour la
                    publication et la gestion d'offres de stage. Les fonctionnalités comprennent la recherche d'offres,
                    la candidature, et des outils de gestion pour les entreprises.
                </p>

                <h2 className="text-lg font-semibold">2. Accès et inscription</h2>
                <p>
                    Certains services peuvent exiger la création d'un compte. Vous acceptez de fournir des informations
                    exactes et de garder votre compte sécurisé. Vous êtes responsable de toute activité réalisée via
                    votre compte.
                </p>

                <h2 className="text-lg font-semibold">3. Utilisation acceptable</h2>
                <p>
                    Vous acceptez de ne pas utiliser le service à des fins illégales, nuisibles, menaçantes,
                    diffamatoires, ou pour transmettre des contenus violant des droits de tiers. Le non-respect peut
                    entraîner la suspension ou la suppression de votre compte.
                </p>

                <h2 className="text-lg font-semibold">4. Contenu utilisateur</h2>
                <p>
                    Les utilisateurs conservent la propriété de leurs contenus. En publiant sur la plateforme, vous
                    accordez à Stagora une licence non exclusive, mondiale et gratuite pour utiliser, reproduire et
                    afficher ce contenu dans le cadre du service.
                </p>

                <h2 className="text-lg font-semibold">5. Propriété intellectuelle</h2>
                <p>
                    Tous les contenus fournis par Stagora (textes, logos, icônes, images) sont la propriété de Stagora
                    ou de ses concédants. Toute reproduction non autorisée est interdite.
                </p>

                <h2 className="text-lg font-semibold">6. Limitation de responsabilité</h2>
                <p>
                    Dans la mesure permise par la loi, Stagora ne sera pas responsable des dommages directs, indirects,
                    accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser le
                    service.
                </p>

                <h2 className="text-lg font-semibold">7. Modifications</h2>
                <p>
                    Nous pouvons modifier ces conditions à tout moment. Les modifications prendront effet dès leur
                    publication. Il est de votre responsabilité de consulter régulièrement cette page.
                </p>

                <h2 className="text-lg font-semibold">8. Droit applicable et juridiction</h2>
                <p>
                    Ces conditions sont régies par le droit français. En cas de litige, les tribunaux français seront
                    compétents, sauf disposition légale contraire.
                </p>

                <h2 className="text-lg font-semibold">9. Contact</h2>
                <p>
                    Pour toute question concernant ces conditions, contactez-nous à
                    <a className="link link-hover ml-1" href="mailto:legal@stagera.example">
                        legal@stagera.example
                    </a>
                    .
                </p>
            </section>

            <footer className="mt-8 text-sm text-base-content/60">
                <Link to="/privacy" className="link link-hover mr-4">
                    Politique de confidentialité
                </Link>
                <Link to="/cookies" className="link link-hover">
                    Politique des cookies
                </Link>
            </footer>
        </main>
    );
}
