# ClassFlow

ClassFlow est une plateforme de gestion de classe destinée aux étudiants, enseignants et administrateurs. Le dépôt conserve un frontend Angular, un backend Spring Boot et un modèle de compte partagé pour toute l'application.

## Technologies

- Frontend : Angular 19
- Backend : Spring Boot 4.1.1 et Java 25
- Base de données : MySQL fourni par XAMPP
- Accès aux données : Spring Data JPA
- Migrations SQL : Flyway

## Pré-requis

- JDK 25
- Node.js et npm
- XAMPP avec le module MySQL démarré

## 1. Préparer MySQL avec XAMPP

1. Ouvrir le panneau de contrôle XAMPP.
2. Démarrer **MySQL**. Apache n'est pas nécessaire pour Angular ou Spring Boot ; il sert uniquement si tu souhaites ouvrir phpMyAdmin depuis XAMPP.
3. Ouvrir `http://localhost/phpmyadmin`.
4. Exécuter le contenu de `database/create_database.sql` dans l'onglet SQL. Cela crée la base `classflow`.
5. La migration Flyway `V1__create_core_schema.sql` crée ensuite la table `users` au premier démarrage du backend.

Configuration locale par défaut : utilisateur MySQL `root`, mot de passe vide, port `3306`. Si ton installation XAMPP utilise un autre mot de passe ou port, adapte `application.yml` et les variables d'environnement correspondantes.

## 2. Démarrer le backend

Dans un terminal :

```powershell
cd backend-springboot
.\mvnw.cmd spring-boot:run
```

Le backend écoute sur `http://localhost:8080`. Flyway applique automatiquement les migrations du dossier `backend-springboot/src/main/resources/db/migration`.

## Réinitialisation du mot de passe (US05)

Les pages `/forgot-password` et `/reset-password` permettent de demander un lien de réinitialisation puis de choisir un nouveau mot de passe. Le backend envoie un jeton aléatoire à usage unique, stocke uniquement son empreinte et le fait expirer après 15 minutes. La migration Flyway `V2__create_password_reset_tokens.sql` ajoute la table nécessaire sans modifier la migration initiale.

Configure un serveur SMTP avant d'utiliser l'envoi d'e-mails, en définissant `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` et `SMTP_FROM`. `FRONTEND_URL` définit l'adresse utilisée dans le lien (par défaut `http://localhost:4200`). Ces variables sont listées dans `.env.example`, qui est un modèle et n'est pas chargé automatiquement par Spring Boot. Définis-les dans l'environnement du backend.

## 3. Démarrer Angular

Dans un deuxième terminal :

```powershell
cd frontend-angular
npm ci
npm start
```

Ouvrir `http://localhost:4200`. Le proxy Angular transmet les appels `/api` vers `http://localhost:8080`. L'application ouvre la page de connexion ; le lien « Mot de passe oublié ? » mène au parcours US05.

## Architecture partagée

- `user.User` et `user.Role` sont les modèles communs des comptes. Les modules fonctionnels doivent les réutiliser.
- L'authentification et les règles d'autorisation doivent rester centralisées.
- Les endpoints `/api/admin/users` existants restent protégés par le rôle `ADMIN`.
- Les migrations SQL sont centralisées dans `backend-springboot/src/main/resources/db/migration` et suivent une numérotation globale.
- Ne jamais modifier une migration Flyway déjà appliquée sur une base partagée. Ajouter une nouvelle migration pour toute évolution.

## Vérifications

Backend :

```powershell
cd backend-springboot
.\mvnw.cmd test
.\mvnw.cmd clean package
```

Frontend :

```powershell
cd frontend-angular
npm run build
```

## Périmètre actuel

Cette version contient la page de connexion ClassFlow et le parcours US05 de réinitialisation de mot de passe oublié. La connexion n'est pas encore reliée à un service d'authentification. Les fonctionnalités Filières/classes/affectation, cours, emplois du temps, présences, devoirs, documents, notifications et messagerie ne sont pas encore implémentées dans cette archive. Elles devront être ajoutées progressivement dans les modules communs du même projet.
