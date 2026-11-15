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

Le backend écoute sur `http://localhost:8080`. Flyway applique automatiquement les migrations du dossier `src/main/resources/db/migration`.

## 3. Démarrer Angular

Dans un deuxième terminal :

```powershell
cd frontend-angular
npm ci
npm start
```

Ouvrir `http://localhost:4200`. Le proxy Angular transmet les appels `/api` vers `http://localhost:8080`.



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

Cette version contient le socle partagé des comptes et le module d'administration US11. Les fonctionnalités Filières/classes/affectation, cours, emplois du temps, présences, devoirs, documents, notifications et messagerie ne sont pas encore implémentées dans cette archive. Elles devront être ajoutées progressivement dans les modules communs du même projet.
