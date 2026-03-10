# Gestion de projet M2

## Sujet

Forum stages

## Équipe

| Prénom Nom                   | Rôle                        |
| ---------------------------- | --------------------------- |
| Emanuel Fernandes dos Santos | Product owner / développeur |
| Médéric Cuny                 | Scrum master / développeur  |
| Meriem Ait El Achkar         | Développeur                 |
| Nicolas Blachère             | Développeur                 |
| Alexis Chapusot              | Développeur                 |
| Ioann Perez                  | Développeur                 |
| Erwan Ortega                 | Développeur                 |

## Architecture du code

```
├── apps/
│   ├── api/
│   │   ├── .env
│   │   ├── package.json
│   │   ├── src/
│   │   │   └── module/
│   │   │       ├── module.service
│   │   │       ├── module.controller
│   │   │       ├── module.module
│   │   │       ├── module.schema
│   │   │       └── dto/
│   │   │           ├── module.dto
│   │   │           └── createModule.dto
│   │   └── test/
│   │       ├── unit/
│   │       │    └── module/
│   │       │      ├── module.controller.spec
│   │       │      └── module.service.spec
│   │       └── integration/
│   │               └── module.spec
│   └── client/
│       ├── .env
│       ├── package.json
│       ├── public
│       └── src/
│           ├── apis/
│           ├── hooks/
│           ├── middlewares/
│           ├── pages/
│           │     ├── forums/
|           |     |     ├── components/
|           |     |     |         ├── ForumCard.tsx
|           |     |     |         ├── ForumHeader.tsx
|           |     |     |         ├── MessageItem.tsx
|           |     |     |         └── ReplyMessage.txs
|           |     |     ├── ForumPage.tsx
|           |     |     ├── MainForumPage.tsx
|           |     |     └── TopicDetailPage.tsx
│           │     ├── internships/
|           |     |     ├── components/
|           |     |     |         └── InternshipCard.tsx
|           |     |     ├── InternshipsPage.tsx
|           |     |     ├── InternshipDetailPage.tsx
│           ├── routings/
│           ├── stores/
│           ├── types/
│           └── utils/
├── .gitignore
└── package.json
```

### API

- `module.controller` : gestion des requêtes entrantes
- `module.service` : logique métier
- `module.schema` : schéma de la base de données
- `module.module` : gestion des dépendances et exports
- `dto/` : objets de transfert de données pour valider les entrées utilisateur
- `test/unit/` : tests unitaires des modules
- `test/integration/` : tests d'intégration des modules

### Client

- `components/` : composants réutilisables des pages
- `hooks/` : hooks réutilisables des pages
- `modules/` : modules de l'application (ex: auth, profile, forum, etc) contenant la logique métier
- `pages/` : pages de l'application assemblant les composants et modules

## Branches

1 feature = 1 branche, puis fusion vers dev avec un pull request, puis merge vers main en fin de sprint

```
  │
  ├──────────────┐
  │              ├──────┐
  │       ┌──────┤      │
  │       │      │      │
main  feature2  dev  feature1

```

## Pull request

Les fusions vers `dev` et `main` sont protégées. Pour mettre à jour les branches, il faut ouvrir une pull request en expliquant les modifications de la branche. La branche ne peut être fusionnée avec `dev` uniquement que si deux personnes non autrices des modifications les ont validées et que les conflits ont étés résolus. Idem pour la branche `main`.

## Format des pull request

```
Titre

Description courte des changements
- Liste
- des
- changements
- importants
```

## Format des commits

`type: description courte des changements` avec `type` dans :

- feat : nouvelle fonctionnalité
- fix : correction de bug
- docs : modification de la documentation
- style : modification de style (formatage, point-virgule, etc.) sans impact sur le code
- refactor : modification du code sans ajout de fonctionnalité ou correction de bug
- test : ajout ou modification de tests
- chore : modification des tâches de build ou des dépendances

## Installation et lancement

### Prérequis

- Node.js (version 22 ou supérieure recommandée)
- npm (généralement installé avec Node.js)
- MongoDB (pour la base de données)
- Clé API Geoapify

### Installation

1.  **Cloner le projet**

    ```bash
    git clone <url-du-repo>
    cd gestion-projet-m2
    ```

2.  **Installer les dépendances**

    ```bash
    npm install
    ```

    Cette commande installera les dépendances du workspace ainsi que celles de l'API et du client.

3.  **Configuration des variables d'environnement**

    **Pour l'API** (`apps/api/.env`) :

    ```env
    # Base de données
    MONGODB_URI=mongodb://localhost:27017/gestion-projet

    # Port de l'API
    PORT=3000

    # JWT
    JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
    ACCESS_TOKEN_SECRET=your_access_token_secret_here
    REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

    ACCESS_TOKEN_LIFESPAN_MINUTES=5
    REFRESH_TOKEN_LIFESPAN_MINUTES=43200

    # Server File
    MINIO_ENDPOINT=api.minio.example.com #without http:// or https://

    MINIO_PORT=443 #https
    MINIO_USE_SSL=true #if you use https
    MINIO_ACCESS_KEY="your-access-key"
    MINIO_SECRET_KEY="your-secret-key"
    MINIO_BUCKET="name-of-the-bucket"

    # Rate limit TTL in milliseconds (60000 = 1 minute)
    RATE_LIMIT_TTL=60000

    # Maximum requests per TTL window
    RATE_LIMIT_MAX=10

    # Mailer configuration
    MAIL_USER="change-with-functional-address@example.com"
    MAIL_PASS="your-specific-password-for-this"
    MAIL_FROM_NAME=Stagora
    MAIL_FROM_EMAIL="display-this-name-in-the-mail@example.com" #Don't work with all mailer like Gmail.

    # Import Limits
    IMPORT_MAX_ROWS=1000
    IMPORT_MAX_SIZE_BYTES=2097152 # 2 * 1024 * 1024 (2 Mo)
    ```

    **Pour le client** (`apps/client/.env`) :

    ```env
    VITE_APIURL="http://localhost:3000"
    VITE_CONTACT_EMAIL="contact@example.com"
    VITE_SUPPORT_EMAIL="support@example.com"
    VITE_LEGAL_EMAIL="legal@example.com"
    VITE_GEOAPIFY_KEY="la clé de votre compte Geoapify"
    ```

### Lancement

**Lancer l'ensemble de l'application (API + Client)** :

```bash
npm run dev
```

- L'API sera accessible sur `http://localhost:3000`
- Le client sera accessible sur `http://localhost:5173` (port par défaut de Vite)

**Lancer uniquement l'API** :

```bash
npm run api
```

L'API sera accessible sur `http://localhost:3000`

**Lancer uniquement le client** :

```bash
npm run client
```

Le client sera accessible sur `http://localhost:5173`

**Lancer les tests** :

```bash
npm run test        # Lance tous les tests
npm run test:cov    # Lance les tests avec couveture
npm run test:seq    # Lance les tests en séquentiel 
```
**Build le projet**

```bash
npm run build
```
permet notamment de détecter les erreurs de compilation avant la mise en production
