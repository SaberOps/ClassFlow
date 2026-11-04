# ClassFlow

ClassFlow is a shared class-management application for students, teachers and administrators.
The repository uses one Angular frontend, one Spring Boot backend and one PostgreSQL database.
Feature modules share the same account model, role definitions, database schema and security configuration.

## Technology stack

- Frontend: Angular 19
- Backend: Spring Boot 4.1.1, Java 25
- Persistence: Spring Data JPA
- Database: PostgreSQL 16
- Schema management: Flyway

## Prerequisites

- JDK 25
- Docker Desktop with Docker Compose
- Node.js and npm

## Start the application

1. Copy `.env.example` to `.env` at the repository root.
2. Start PostgreSQL: `docker compose up -d`.
3. In a terminal, start the backend:
   `cd backend-springboot` then `./mvnw spring-boot:run` (Windows: `.\mvnw.cmd spring-boot:run`).
4. In another terminal, start Angular:
   `cd frontend-angular`, `npm ci`, then `npm start`.
5. Open `http://localhost:4200`.

The backend listens on `http://localhost:8080`. Flyway applies the shared baseline schema from
`src/main/resources/db/migration`. The baseline currently defines the shared `users` table,
including account lifecycle fields used by the administration module. Other feature modules
should extend this common schema through subsequent, globally versioned migrations.

## Shared architecture rules

- Reuse `user.User` and `user.Role`; do not create feature-specific copies.
- Keep one authentication and authorization mechanism for the whole application.
- Put database migrations in the single Flyway migration directory and use a global sequence
  (`V2__...`, `V3__...`, etc.) as the application schema grows.
- Never rename or edit a migration that has already been applied to a shared database.
- Protect administrative operations with the shared security configuration and role authorities.

## Validation

Backend tests: `./mvnw test` (Windows: `.\mvnw.cmd test`).
Backend package: `./mvnw clean package`.
Frontend build: `npm run build`.

## Current repository scope

This source snapshot contains the shared account foundation and administration account-management
module. It does not contain the implementations of the other planned ClassFlow features; those
modules must be merged into this common application as they are developed.
