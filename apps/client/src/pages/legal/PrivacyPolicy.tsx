import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  const year = new Date().getFullYear();

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Politique de confidentialité</h1>
        <p className="text-sm text-base-content/70 mt-2">Dernière mise à jour : {year}</p>
      </header>

      <section className="prose prose-invert mb-6">
        <p>
          La présente politique explique quelles données nous collectons, pourquoi nous les utilisons
          et les droits dont vous disposez. Nous nous engageons à protéger la vie privée des
          utilisateurs et à respecter la réglementation applicable, y compris le RGPD.
        </p>

        <h2>1. Données collectées</h2>
        <p>
          Nous collectons des données que vous fournissez (profil, CV, candidatures), des données
          techniques (adresse IP, type de navigateur) et des données de navigation (pages visitées,
          interactions). Certaines données sont nécessaires pour fournir nos services.
        </p>

        <h2>2. Finalités du traitement</h2>
        <p>
          Les données servent à : fournir et améliorer le service, authentifier les utilisateurs,
          gérer les candidatures, communiquer (notifications, e-mails). Nous pouvons également
          anonymiser des données pour des analyses statistiques.
        </p>

        <h2>3. Base légale</h2>
        <p>
          Les traitements reposent sur l'exécution d'un contrat, le consentement (pour certains
          usages marketing), l'obligation légale ou l'intérêt légitime pour l'amélioration du
          service.
        </p>

        <h2>4. Partage des données</h2>
        <p>
          Nous ne revendons pas vos données. Nous pouvons partager des données avec des prestataires
          techniques (hébergement, analytics) soumis à des obligations de confidentialité.
        </p>

        <h2>5. Durée de conservation</h2>
        <p>
          Les données sont conservées le temps nécessaire aux finalités. Les données de compte sont
          conservées tant que le compte existe ; les données analytiques sont conservées de façon
          agrégée pendant une durée limitée.
        </p>

        <h2>6. Vos droits</h2>
        <p>
          Vous avez le droit d'accéder, rectifier, supprimer vos données, de demander la limitation
          du traitement ou de vous opposer. Vous pouvez également demander la portabilité de vos
          données lorsque cela est applicable.
        </p>

        <h2>7. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour
          protéger vos données. Cependant, aucune méthode de transmission sur Internet n'est
          totalement sécurisée.
        </p>

        <h2>8. Transferts hors UE</h2>
        <p>
          Si des données sont transférées hors de l'UE, cela se fera dans le respect des garanties
          légales (clauses contractuelles types, décisions d'adéquation, etc.).
        </p>

        <h2>9. Contact et réclamations</h2>
        <p>
          Pour exercer vos droits ou poser une question, contactez-nous :
          <a className="link link-hover ml-1" href="mailto:privacy@stagera.example">privacy@stagera.example</a>.
          Vous pouvez saisir l'autorité de contrôle compétente (CNIL) en cas de réclamation.
        </p>
      </section>

      <footer className="mt-8 text-sm text-base-content/60">
        <Link to="/terms" className="link link-hover mr-4">Conditions d'utilisation</Link>
        <Link to="/cookies" className="link link-hover">Politique des cookies</Link>
      </footer>
    </main>
  );
}
