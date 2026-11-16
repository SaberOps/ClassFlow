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
    <section class="welcome">
      <div>
        <p class="eyebrow">ESPACE ÉTUDIANT</p>
        <h1>Bonjour{{ profile() ? ', ' + profile()!.firstName : '' }} 👋</h1>
        <p>Retrouvez vos cours, vos échéances et les dernières informations de votre espace.</p>
      </div>
      <a routerLink="/student/courses">Consulter mes cours <span aria-hidden="true">→</span></a>
    </section>

    @if (error()) { <div class="alert" role="alert">{{ error() }}</div> }
    @if (loading()) { <div class="loading" role="status">Chargement de votre espace…</div> }

    <section class="stats" aria-label="Résumé de votre activité">
      <article><span>Cours suivis</span><strong>{{ courses().length }}</strong><small>Votre parcours actuel</small></article>
      <article><span>Travaux à rendre</span><strong>{{ todo() }}</strong><small>À préparer ou à déposer</small></article>
      <article><span>Notifications non lues</span><strong>{{ unread() }}</strong><small>Informations récentes</small></article>
    </section>

    <div class="columns">
      <section class="panel">
        <div class="section-heading"><div><p class="eyebrow">À NE PAS MANQUER</p><h2>Prochaines échéances</h2></div><a routerLink="/student/assignments">Tout voir</a></div>
        @if (!loading() && upcoming().length === 0) { <p class="empty">Aucune échéance à venir.</p> }
        @for (a of upcoming(); track a.id) {
          <a class="assignment" [routerLink]="['/student/assignments', a.id]">
            <span class="assignment-icon">↗</span><span class="assignment-info"><strong>{{ a.title }}</strong><small>{{ a.courseTitle }}</small></span>
            <span class="due">{{ a.dueAt | date:'d MMM, HH:mm' }}</span>
          </a>
        }
      </section>
      <section class="panel">
        <div class="section-heading"><div><p class="eyebrow">ACTUALITÉS</p><h2>Notifications</h2></div><a routerLink="/student/notifications">Tout voir</a></div>
        @if (!loading() && notes().length === 0) { <p class="empty">Vous êtes à jour.</p> }
        @for (n of notes(); track n.id) {
          <article class="notice"><span class="dot" [class.unread]="!n.read"></span><div><strong>{{ n.title }}</strong><p>{{ n.body }}</p><small>{{ n.createdAt | date:'d MMM, HH:mm' }}</small></div></article>
        }
      </section>
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1440px;margin:auto;color:#172033}.welcome{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:30px;border-radius:22px;background:linear-gradient(115deg,#10243e,#1d4771);color:#fff}.welcome h1{font-size:clamp(1.7rem,3vw,2.4rem);margin:5px 0}.welcome p{color:#d8e5f3;margin:6px 0}.welcome .eyebrow{color:#8dc5ff}.welcome>a{white-space:nowrap;padding:12px 16px;border-radius:12px;background:#fff;color:#173b60;text-decoration:none;font-weight:700}.eyebrow{font-size:.72rem;letter-spacing:.12em;font-weight:800;color:#63809e}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:22px 0}.stats article,.panel{background:#fff;border:1px solid #e6ebf1;border-radius:18px;padding:20px;box-shadow:0 5px 18px #17203308}.stats span,.stats small{display:block;color:#718096}.stats strong{display:block;font-size:2rem;margin:8px 0;color:#173b60}.columns{display:grid;grid-template-columns:1.2fr 1fr;gap:18px}.section-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.section-heading h2{font-size:1.15rem;margin:4px 0}.section-heading a{font-size:.88rem;color:#2463a5;text-decoration:none;font-weight:700}.assignment{display:flex;align-items:center;gap:12px;padding:14px 0;border-top:1px solid #edf0f4;color:inherit;text-decoration:none}.assignment-icon{width:36px;height:36px;display:grid;place-items:center;background:#edf5ff;color:#2865a3;border-radius:11px}.assignment-info{display:grid;gap:4px;flex:1}.assignment-info small,.notice small{color:#7a8797}.due{font-size:.82rem;color:#4c6179;white-space:nowrap}.notice{display:flex;gap:12px;padding:13px 0;border-top:1px solid #edf0f4}.notice p{margin:5px 0;color:#5c6878;font-size:.9rem}.dot{width:8px;height:8px;flex:none;margin-top:6px;border-radius:50%;background:#cbd5e1}.dot.unread{background:#2879c7}.empty,.loading{color:#718096;padding:18px 0}.alert{padding:12px 14px;border-radius:12px;background:#fff1f0;color:#a3332b;margin-top:16px}@media(max-width:900px){.columns{grid-template-columns:1fr}}@media(max-width:620px){.welcome{align-items:flex-start;flex-direction:column;padding:22px}.stats{grid-template-columns:1fr;gap:10px}.stats article{padding:15px}.due{font-size:.75rem}}
  `]
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
    this.api.profile().subscribe({ next: p => this.profile.set(p), error: () => this.error.set('Impossible de charger votre profil.'), complete: finish });
    this.api.courses().subscribe({ next: c => this.courses.set(c), error: () => this.error.set('Impossible de charger vos cours.'), complete: finish });
    this.api.assignments().subscribe({
      next: list => {
        const pending = list.filter(a => a.status === 'TODO' || a.status === 'LATE');
        this.todo.set(pending.length);
        this.upcoming.set(pending.slice(0, 5));
      },
      error: () => this.error.set('Impossible de charger vos échéances.'),
      complete: finish
    });
    this.api.notifications().subscribe({
      next: list => { this.notes.set(list.slice(0, 5)); this.unread.set(list.filter(n => !n.read).length); },
      error: () => this.error.set('Impossible de charger vos notifications.'),
      complete: finish
    });
  }
}
