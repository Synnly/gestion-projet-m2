import { Link } from 'react-router-dom';

export default function CookiePolicy() {
    const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    return (
        <main className="max-w-3xl mx-auto py-12 px-6">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold">Politique des cookies</h1>
                <p className="text-sm text-base-content/70 mt-2">Dernière mise à jour : {today}</p>
            </header>

            <section className="prose prose-invert mb-6 space-y-6">
                <p>
                    Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience, analyser
                    l'utilisation du site et proposer des contenus pertinents. Cette politique explique les types de
                    cookies utilisés et comment les gérer.
                </p>

                <h2 className="text-lg font-semibold">1. Qu'est-ce qu'un cookie ?</h2>
                <p>
                    Un cookie est un petit fichier texte stocké dans votre navigateur qui permet de reconnaître votre
                    appareil et de mémoriser certaines informations.
                </p>

                <h2 className="text-lg font-semibold">2. Types de cookies utilisés</h2>
                <ul>
                    <li>
                        <strong>Essentiels :</strong> nécessaires au fonctionnement du site (ex. sessions).
                    </li>
                    <li>
                        <strong>Fonctionnels :</strong> pour mémoriser vos préférences (langue, affichage).
                    </li>
                    <li>
                        <strong>Analytics :</strong> pour mesurer et analyser l'utilisation du site (Google Analytics ou
                        équivalent).
                    </li>
                    <li>
                        <strong>Marketing :</strong> pour la publicité ciblée et le suivi cross-site.
                    </li>
                </ul>

                <h2 className="text-lg font-semibold">3. Consentement</h2>
                <p>
                    Sauf pour les cookies strictement nécessaires, nous demandons votre consentement avant d'activer les
                    cookies non essentiels. Vous pouvez modifier vos préférences à tout moment.
                </p>

                <h2 className="text-lg font-semibold">4. Gérer et supprimer les cookies</h2>
                <p>
                    Vous pouvez gérer les cookies via les paramètres de votre navigateur ou utiliser le gestionnaire de
                    préférences disponible sur le site. La suppression des cookies peut altérer certaines
                    fonctionnalités.
                </p>

                <h2 className="text-lg font-semibold">5. Durée de conservation</h2>
                <p>
                    La durée de conservation dépend du type de cookie : certains sont supprimés à la fin de la session,
                    d'autres restent plusieurs mois.
                </p>

                <h2 className="text-lg font-semibold">6. Contact</h2>
                <p>
                    Pour toute question relative aux cookies, contactez
                    <a className="link link-hover ml-1" href="mailto:privacy@stagera.example">
                        privacy@stagera.example
                    </a>
                    .
                </p>
            </section>

            <footer className="mt-8 text-sm text-base-content/60">
                <Link to="/privacy" className="link link-hover mr-4">
                    Politique de confidentialité
                </Link>
                <Link to="/terms" className="link link-hover">
                    Conditions d'utilisation
                </Link>
            </footer>
        </main>
    );
}
