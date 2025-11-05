
## Largeur max d'une ligne
Max ~120 caractères sauf spécifiques à discuter avec le reste de l'équipe


## Langue
Écrire le code en **anglais**, commentaires compris

---

## Typage
Toute fonction, paramètre, propriété et variable doit être typée. Le type `any` doit être évité le plus possible et réservé à 
des cas très spécifiques à discuter avec le reste de l'équipe

---

## Classes
Le nom doit être en **PascalCase**

>Exemple : `UserController`

---

## Fichiers
### Nomenclature
Utiliser le **camelCase** avec le format `module.typeDeFichier.ts`

> Exemple :  `user.service.ts`, `createUser.dto.ts`

---

## Fonctions

### Taille
Max ~80 lignes sauf cas spécifiques à discuter avec le reste de l'équipe

### Nomenclature
Utiliser le camel case avec un nom relativement concis. Si le nom est trop verbeux, la fonction a probablement trop de
responsabilités. Dans ce cas, il faut segmenter la fonction en plusieurs parties.

### TSDoc
Toutes les fonctions doivent avoir une TSDoc qui décrit brièvement la fonction. La documentation doit contenir **A MINIMA** :
- Courte description
- Description des paramètres
- Valeur retournée si la fonction n'est pas une procédure
- Exceptions lancées
> Exemple :
> ```ts
>\/**
>  * Renvoie l'utilisateur en fonction de son id
>  * @param id L'identifiant de l'utilsiateur
>  * @returns L'utilisateur
>  * @throws {NotFoundException} si l'id ne correspond à aucun utilisateur 
>  */
> async getUserById(id: number) : Promise<User> { ... }
>```

---

## Propriétés

| Type         | Style                 | Exemple                          |
|--------------|-----------------------|----------------------------------|
| Booléens     | is/hasPropriété       | isReady / hasCompletedProcessing |
| Constantes   | MAJUSCULE, SNAKE_CASE | MAX_CAPACITY                     |
| Énumérations | MAJUSCULE, SNAKE_CASE | Color.BLUE, States.READY_TO_DRAW |    

---

## Tests
Utiliser le format "Given When Then"
- Given : L'état du système au moment du test
- When : L'action effectuée
- Then : La sortie attendue

> Exemple : Prendre 2 pomme de son pannier contenant 5 pommes
> - Given = Étant donné que j'ai 5 pommes dans mon panier
> - When = Quand je prends 2 pommes de mon panier
> - Then = J'ai 3 pommes dans mon panier
>```ts
>it('should take 2 apples from the basket when 5 apples are in the basket and then have 3 apples in the basket', () => {
>    ...
>}
>```