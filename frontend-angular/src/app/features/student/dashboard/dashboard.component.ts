import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentApiService } from '../../../core/services/student-api.service';
import { AssignmentListItem, CourseSummary, NotificationItem, Profile } from '../../../shared/models/student.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="dashboard">
      <section class="welcome" aria-labelledby="student-welcome-title">
        <div class="hero-watermark" aria-hidden="true">FST</div>
        <div class="welcome-copy">
          <p class="eyebrow"><span class="pulse-dot" aria-hidden="true"></span>FST · VOTRE CAMPUS, EN MOUVEMENT</p>
          <h1 id="student-welcome-title">
            Bonjour, <span class="student-name">{{ profile()?.firstName || 'étudiant' }}</span>
            <span class="wave" aria-hidden="true">✦</span>
          </h1>
          <p>Vos cours, vos échéances et la vie du campus réunis dans un même espace.</p>
          <a class="hero-action" routerLink="/student/courses">
            <span class="action-icon" aria-hidden="true">▤</span>
            <span>Consulter mes cours</span>
            <span class="action-arrow" aria-hidden="true">→</span>
          </a>
        </div>

        <aside class="welcome-card" aria-label="Votre prochaine étape">
          <div class="welcome-card-top">
            <span class="card-symbol" aria-hidden="true">✧</span>
            <span>CAP SUR LA RÉUSSITE</span>
          </div>
          @if (loading()) {
            <p class="next-label">VOTRE ESPACE</p>
            <h2>On prépare votre journée…</h2>
          } @else if (upcoming().length > 0) {
            <p class="next-label">PROCHAINE ÉCHÉANCE</p>
            <h2>{{ upcoming()[0].title }}</h2>
            <p class="hero-due">{{ upcoming()[0].dueAt | date:'EEEE d MMMM · HH:mm' }}</p>
          } @else {
            <p class="next-label">VOTRE ESPACE</p>
            <h2>Tout est prêt pour avancer.</h2>
            <p class="hero-due">{{ courses().length }} cours dans votre parcours</p>
          }
          <div class="welcome-card-footer">
            <span class="live-dot" aria-hidden="true"></span>
            <span>Votre espace, en un seul endroit</span>
          </div>
        </aside>
      </section>

      @if (error()) { <div class="alert" role="alert">{{ error() }}</div> }
      @if (loading()) {
        <div class="loading" role="status"><span class="spinner" aria-hidden="true"></span>Chargement de votre espace…</div>
      }

      <section class="stats" aria-label="Résumé de votre activité">
        <article class="stat-card stat-courses">
          <span class="stat-icon" aria-hidden="true">▤</span>
          <div class="stat-copy"><span>Cours suivis</span><small>Votre parcours actuel</small></div>
          <strong>{{ loading() ? '…' : courses().length }}</strong>
        </article>
        <article class="stat-card stat-work">
          <span class="stat-icon" aria-hidden="true">✦</span>
          <div class="stat-copy"><span>Travaux à rendre</span><small>À préparer ou à déposer</small></div>
          <strong>{{ loading() ? '…' : todo() }}</strong>
        </article>
        <article class="stat-card stat-notifications">
          <span class="stat-icon" aria-hidden="true">◇</span>
          <div class="stat-copy"><span>Notifications non lues</span><small>Les dernières nouvelles</small></div>
          <strong>{{ loading() ? '…' : unread() }}</strong>
        </article>
      </section>

      <div class="columns">
        <section class="panel" aria-labelledby="deadlines-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">ORGANISEZ-VOUS</p>
              <h2 id="deadlines-title">Prochaines échéances</h2>
            </div>
            <a routerLink="/student/assignments">Tout voir <span aria-hidden="true">↗</span></a>
          </div>
          @if (!loading() && upcoming().length === 0) {
            <div class="empty">
              <span class="empty-icon" aria-hidden="true">✧</span>
              <p>Aucune échéance à venir.</p>
              <small>Profitez-en pour prendre de l’avance sur vos cours.</small>
            </div>
          }
          @for (a of upcoming(); track a.id) {
            <a class="assignment" [routerLink]="['/student/assignments', a.id]">
              <span class="assignment-mark" aria-hidden="true">↗</span>
              <span class="assignment-info">
                <strong>{{ a.title }}</strong>
                <small>{{ a.courseTitle }}</small>
              </span>
              <time class="due" [attr.datetime]="a.dueAt">
                <span class="due-day">{{ a.dueAt | date:'d' }}</span>
                <span class="due-meta">{{ a.dueAt | date:'MMM · HH:mm' }}</span>
              </time>
            </a>
          }
        </section>

        <section class="panel" aria-labelledby="notifications-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">RESTEZ INFORMÉ</p>
              <h2 id="notifications-title">Actualités</h2>
            </div>
            <a routerLink="/student/notifications">Tout voir <span aria-hidden="true">↗</span></a>
          </div>
          @if (!loading() && notes().length === 0) {
            <div class="empty">
              <span class="empty-icon" aria-hidden="true">◇</span>
              <p>Vous êtes à jour.</p>
              <small>Les informations importantes apparaîtront ici.</small>
            </div>
          }
          @for (n of notes(); track n.id) {
            <article class="notice" [class.is-unread]="!n.read">
              <span class="notice-dot" [class.unread]="!n.read" aria-hidden="true"></span>
              <div class="notice-content">
                <div class="notice-heading">
                  <strong>{{ n.title }}</strong>
                  @if (!n.read) { <span class="new-badge">Nouveau</span> }
                </div>
                <p>{{ n.body || 'Consultez cette notification pour en savoir plus.' }}</p>
                <small>{{ n.createdAt | date:'d MMM · HH:mm' }}</small>
              </div>
            </article>
          }
        </section>
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly profile = signal<Profile | null>(null);
  readonly courses = signal<CourseSummary[]>([]);
  readonly upcoming = signal<AssignmentListItem[]>([]);
  readonly notes = signal<NotificationItem[]>([]);
  readonly todo = signal(0);
  readonly unread = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit() {
    let completed = 0;
    const finish = () => { completed += 1; if (completed === 4) this.loading.set(false); };
    this.api.profile().subscribe({ next: p => this.profile.set(p), error: () => { this.error.set('Impossible de charger votre profil.'); finish(); }, complete: finish });
    this.api.courses().subscribe({ next: c => this.courses.set(c), error: () => { this.error.set('Impossible de charger vos cours.'); finish(); }, complete: finish });
    this.api.assignments().subscribe({
      next: list => {
        const pending = list.filter(a => a.status === 'TODO' || a.status === 'LATE');
        this.todo.set(pending.length);
        this.upcoming.set(pending.slice(0, 5));
      },
      error: () => { this.error.set('Impossible de charger vos échéances.'); finish(); },
      complete: finish
    });
    this.api.notifications().subscribe({
      next: list => { this.notes.set(list.slice(0, 5)); this.unread.set(list.filter(n => !n.read).length); },
      error: () => { this.error.set('Impossible de charger vos notifications.'); finish(); },
      complete: finish
    });
  }
}
