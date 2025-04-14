# Exercice 3 - Services d'Échange de Données

Ce projet est une API REST développée avec Node.js, Express et SQLite pour gérer des utilisateurs, des techniciens et des tickets. L'API inclut des fonctionnalités d'authentification, de gestion des tickets et de validation des données.

## Fonctionnalités

- **Authentification** :
  - Connexion des administrateurs, utilisateurs et techniciens.
  - Génération de tokens JWT pour sécuriser les routes protégées.

- **Gestion des utilisateurs** :
  - Création d'utilisateurs et de techniciens (par un administrateur uniquement).

- **Gestion des tickets** :
  - Création, mise à jour et récupération des tickets.
  - Validation des données des tickets avec `express-validator`.

## Prérequis

- [Node.js](https://nodejs.org/) (version 16 ou supérieure)
- [npm](https://www.npmjs.com/) (inclus avec Node.js)
- SQLite (base de données utilisée)

## Installation

1. Clonez le dépôt :
   ```bash
   git clone <url-du-repo>
   cd Exercice-3
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez la base de données SQLite :
   - Le fichier `database.sqlite` sera automatiquement créé lors de l'exécution.

4. Lancez le serveur :
   ```bash
   npm run dev
   ```

5. Accédez à l'API à l'adresse suivante :
   ```
   http://localhost:3000
   ```

## Routes de l'API

### Authentification

- **POST** `/api/auth/admin` : Connexion d'un administrateur.
  - **Body** :
    ```json
    {
      "email": "admin@site.com",
      "password": "admin123"
    }
    ```

- **POST** `/api/auth/login` : Connexion d'un utilisateur ou technicien.
  - **Body** :
    ```json
    {
      "email": "user@site.com",
      "password": "user123"
    }
    ```

- **POST** `/api/auth/new` : Création d'un nouvel utilisateur ou technicien (admin uniquement).
  - **Headers** :
    ```
    Authorization: Bearer <token_admin>
    ```
  - **Body** :
    ```json
    {
      "email": "newuser@site.com",
      "password": "password123",
      "role": "utilisateur"
    }
    ```

### Gestion des tickets

- **POST** `/api/tickets` : Création d'un ticket (utilisateur ou technicien).
  - **Headers** :
    ```
    Authorization: Bearer <token_utilisateur>
    ```
  - **Body** :
    ```json
    {
      "title": "Problème de connexion",
      "description": "Je ne peux pas me connecter à mon compte.",
      "status": "open"
    }
    ```

- **GET** `/api/tickets/:id` : Récupération d'un ticket par son ID.

- **PUT** `/api/tickets/:id` : Mise à jour d'un ticket (technicien uniquement).
  - **Headers** :
    ```
    Authorization: Bearer <token_technicien>
    ```
  - **Body** :
    ```json
    {
      "title": "Mise à jour du titre",
      "description": "Mise à jour de la description",
      "status": "in progress"
    }
    ```

## Technologies utilisées

- **Node.js** : Environnement d'exécution JavaScript.
- **Express** : Framework pour créer des applications web et des API.
- **SQLite** : Base de données légère et intégrée.
- **Knex.js** : ORM pour interagir avec la base de données.
- **bcryptjs** : Pour le hachage des mots de passe.
- **jsonwebtoken** : Pour la gestion des tokens JWT.
- **express-validator** : Pour la validation des données.

## Structure du projet

```
Exercice-3/
├── db.js                # Configuration de la base de données
├── index.js             # Point d'entrée principal de l'application
├── validators/          # Contient les fichiers de validation
│   └── ticketValidator.js
|
├── database.sqlite      # Fichier de base de données SQLite
├── package.json         # Dépendances et scripts du projet
└── README.md            # Documentation du projet
```

## Tests

Vous pouvez tester les routes de l'API avec des outils comme :
- [Postman](https://www.postman.com/)
- [HTTP Client intégré à VS Code](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

Exemple de fichier `request.http` :
```http
### Connexion d'un administrateur
POST http://localhost:3000/api/auth/admin
Content-Type: application/json

{
  "email": "admin@site.com",
  "password": "admin123"
}

### Création d'un ticket
POST http://localhost:3000/api/tickets
Content-Type: application/json
Authorization: Bearer <token_utilisateur>

{
  "title": "Problème de connexion",
  "description": "Je ne peux pas me connecter à mon compte."
}
```

## Auteur

- **Soulaymane Benaddi** - Étudiant au Collège de Maisonneuve

## Licence

Ce projet est sous licence MIT.