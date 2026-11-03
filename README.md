# ClassFlow

Class management platform (students, teachers, administration).
Stack: Angular (frontend), Spring Boot (backend), PostgreSQL (database, via Docker).

## Prerequisites
- Git, JDK (same version for everyone: Java 25), Node.js LTS, Docker Desktop
- Angular CLI: `npm install -g @angular/cli`

## Setup
1. Clone and switch to `develop`:
   git clone <repo-url>
   cd ClassFlow
   git checkout develop
2. Create your local env file: `Copy-Item .env.example .env`
3. Start the database (Docker Desktop running): `docker compose up -d`
4. Backend (terminal 1): `cd backend-springboot` then `.\mvnw.cmd spring-boot:run`
   - Runs on http://localhost:8080 (401 is expected until auth is configured)
5. Frontend (terminal 2): `cd frontend-angular`, `npm install`, then `npm start`
   - Runs on http://localhost:4200

## Workflow
- Never commit to `main` or `develop` directly.
- One branch per user story, from `develop`: `feature/US01-short-name`
- Open a pull request into `develop`, with one review before merging.
- Database changes go in new Flyway migrations (`V2__...sql`). Never edit a migration that was already merged.