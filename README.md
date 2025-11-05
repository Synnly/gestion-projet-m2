# Gestion de projet M2

## Sujet
Forum stages

## Équipe

| Prénom Nom                   | Role                        |
|------------------------------|-----------------------------|
| Emanuel Fernandes dos Santos | Product owner / développeur |
| Médéric Cuny                 | Scrum master / développeur  |
| Meriem Ait El Achkar         | Développeur                 |
| Nicolas Blachere             | Développeur                 |
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
│           ├── components
│           ├── hooks
│           ├── modules
│           └── pages
├── .gitignore
└── package.json
```

### Branches
1 feature = 1 branche, puis fusion vers dev avec un pull request, puis merge vers main en fin de sprint
```
  │
  ├──────────────┐ 
  │              ├──────┐
  │       ┌──────┤      │
  │       │      │      │
main  feature2  dev  feature1

```

### Pull request
Les fusions vers `dev` et `main` sont protégés. Pour mettre à jour les banches, il faut ouvrir un pull request en expliquant
les modifications de la branche. La branche ne peut être fusionnée avec `dev` uniquement que si deux personnes non autrices
des modifications les ont validées et que les conflits ont étés résolus. Idem pour la branche `main`.

## Format des pull request
Titre
Description courte des changements
- Liste
- des
- changements
- importants


## Format des commits
`type: description courte des changements` avec `type` dans :
- feat : nouvelle fonctionnalité
- fix : correction de bug
- docs : modification de la documentation
- style : modification de style (formatage, point-virgule, etc.) sans impact sur le code
- refactor : modification du code sans ajout de fonctionnalité ou correction de bug
- test : ajout ou modification de tests
- chore : modification des tâches de build ou des dépendances

