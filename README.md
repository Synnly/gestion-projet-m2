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
│   │       └── unit/
│   │           ├── module/
│   │           │   ├── module.controller.spec
│   │           │   └── module.service.spec
│   │           └── integration/
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