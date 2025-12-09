import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function SafetyCompliance() {
    const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    return (
        <main className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-8">
                <div className="flex items-center gap-6">
                    <Link to="/" className="btn btn-primary btn-sm rounded-md flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Accueil
                    </Link>

                    <div>
                        <h1 className="text-3xl font-semibold">Sécurité & conformité</h1>
                        <p className="text-sm text-base-content/70 mt-1">Dernière mise à jour : {today}</p>
                    </div>
                </div>
            </header>

            <section className="prose prose-invert mb-6 space-y-6">
                <p>
                    La sécurité et la conformité sont au cœur de Stagora. Nous mettons en place des mesures techniques
                    et organisationnelles pour protéger nos utilisateurs — étudiants et entreprises — et respecter les
                    obligations légales applicables.
                </p>

                <h2 className="text-lg font-semibold">1. Modération et sécurité des contenus</h2>
                <p>
                    Nous surveillons et modérons les contenus publiés sur la plateforme (offres, messages, commentaires)
                    afin de détecter et supprimer les contenus illicites, trompeurs ou inappropriés. Les utilisateurs
                    peuvent signaler facilement un contenu via l'option « Signaler un contenu ».
                </p>

                <h2 className="text-lg font-semibold">2. Vérification des offres et des entreprises</h2>
                <p>
                    Pour réduire les risques de fraude, certaines entreprises peuvent être soumises à des vérifications
                    d'identité ou à la fourniture d'informations supplémentaires (SIRET, justificatif). Ces
                    vérifications respectent la vie privée et les règles applicables.
                </p>

                <h2 className="text-lg font-semibold">3. Protection des données et conformité RGPD</h2>
                <p>
                    Nous appliquons les principes du RGPD : minimisation des données, limitation des finalités, sécurité
                    des traitements et respect des droits des personnes (accès, rectification, suppression,
                    portabilité). Pour plus d'informations, consultez notre
                    <Link to="/privacy" className="link link-hover ml-1">
                        Politique de confidentialité
                    </Link>
                    .
                </p>

                <h2 className="text-lg font-semibold">4. Signalement et réponses aux incidents</h2>
                <p>
                    En cas d'incident de sécurité (ex. fuite de données), nous mettons en œuvre une procédure de réponse
                    rapide : identification, confinement, évaluation d'impact et notification aux personnes concernées
                    et autorités compétentes lorsque nécessaire.
                </p>

                <h2 className="text-lg font-semibold">5. Collaboration avec les autorités et fournisseurs</h2>
                <p>
                    Nous coopérons avec les autorités compétentes et nos prestataires techniques pour enquêter sur les
                    abus et exécuter les obligations légales (prévention de la fraude, demandes judiciaires). Les
                    transferts de données hors de l'UE respectent les garanties légales (clauses contractuelles types,
                    etc.).
                </p>

                <h2 className="text-lg font-semibold">6. Mesures techniques</h2>
                <p>
                    Nous appliquons des mesures standards : chiffrement des communications (TLS), protection des accès,
                    sauvegardes régulières, revues de sécurité et correctifs. Les informations sensibles sont stockées
                    de manière sécurisée.
                </p>

                <h2 className="text-lg font-semibold">7. Signalement des vulnérabilités</h2>
                <p>
                    Si vous identifiez une vulnérabilité, merci de nous contacter immédiatement à
                    <a className="link link-hover ml-1" href="mailto:security@stagera.example">
                        security@stagera.example
                    </a>
                    . Nous répondrons rapidement et vous informerons des étapes prises pour corriger le problème.
                </p>

                <h2 className="text-lg font-semibold">8. Conduite attendue des utilisateurs</h2>
                <p>
                    Les utilisateurs doivent respecter les règles d'utilisation : ne pas publier de contenus illégaux,
                    ne pas usurper d'identité et ne pas tenter d'extraire ou d'abuser des données d'autres utilisateurs.
                </p>

                <h2 className="text-lg font-semibold">9. Questions et assistance</h2>
                <p>
                    Pour toute question relative à la sécurité ou la conformité, écrivez à
                    <a className="link link-hover ml-1" href="mailto:security@stagera.example">
                        security@stagera.example
                    </a>
                    .
                </p>
            </section>

            <footer className="mt-8 text-sm text-base-content/60">
                <Link to="/report" className="link link-hover mr-4">
                    Signaler un contenu
                </Link>
                <Link to="/privacy" className="link link-hover">
                    Politique de confidentialité
                </Link>
            </footer>
        </main>
    );
}
