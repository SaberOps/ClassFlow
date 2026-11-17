import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TeacherApiService, TeacherSession } from '../../../core/services/teacher-api.service';

@Component({
  selector: 'app-teacher-timetable',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page">
      <header class="page-head"><div><p class="eyebrow">ORGANISATION DE LA SEMAINE</p><h1>Emploi du temps</h1><p>Toutes vos séances, pour l’ensemble de vos classes.</p></div></header>
      <section class="week-panel">
        <div class="week-toolbar"><button type="button" aria-label="Semaine précédente" (click)="moveWeek(-7)">←</button><div><strong>{{ weekStart() | date:'d MMM' }} — {{ weekEnd() | date:'d MMM y' }}</strong><small>Vue hebdomadaire · fuseau horaire local</small></div><button type="button" aria-label="Semaine suivante" (click)="moveWeek(7)">→</button><button type="button" class="today" (click)="goToday()">Aujourd’hui</button></div>
        @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
        @if (loading()) { <p class="loading" role="status">Chargement de votre emploi du temps…</p> }
        @else if (!sessions().length) { <div class="empty"><span aria-hidden="true">▦</span><h2>Aucune séance cette semaine</h2><p>Les séances planifiées pour vos cours s’afficheront ici.</p></div> }
        @else {
          <div class="session-list">
            @for (session of sessions(); track session.id) {
              <article class="session" [class.cancelled]="session.cancelled">
                <time class="date"><b>{{ session.startsAt | date:'EEE' }}</b><strong>{{ session.startsAt | date:'d' }}</strong><small>{{ session.startsAt | date:'MMM' }}</small></time>
                <div class="time"><strong>{{ session.startsAt | date:'HH:mm' }} — {{ session.endsAt | date:'HH:mm' }}</strong><small>{{ session.room || 'Salle à confirmer' }}</small></div>
                <div class="session-info"><h2>{{ session.courseTitle }}</h2><p class="class-name">{{ session.className || 'Classe non précisée' }}</p><small>{{ session.cancelled ? 'Séance annulée' : (session.lastMinuteChange ? 'Changement récent' : 'Séance planifiée') }}</small>@if (session.changeNote) { <p>{{ session.changeNote }}</p> }</div>
                <a [routerLink]="['/teacher/attendance']" [queryParams]="{session: session.id, start: weekStartIso()}">Présences <span aria-hidden="true">↗</span></a>
              </article>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1120px;margin:auto;color:#292a4d}*{box-sizing:border-box}.page{display:grid;gap:18px}.eyebrow{margin:0 0 7px;color:#7771b4;font-size:.67rem;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:2rem;letter-spacing:-.05em}.page-head p:last-child{margin:7px 0 0;color:#77758d;font-size:.88rem}.week-panel{overflow:hidden;border:1px solid #e8e7f2;border-radius:17px;background:#fff;box-shadow:0 5px 18px rgb(48 43 112 / 3%)}.week-toolbar{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #efedf5;background:#fbfaff}.week-toolbar>button{display:grid;width:35px;height:35px;place-items:center;border:1px solid #e5e3ef;border-radius:9px;color:#56518f;background:#fff;font-size:1.1rem;cursor:pointer}.week-toolbar>div{display:grid;gap:3px;min-width:0}.week-toolbar strong{font-size:.87rem}.week-toolbar small{color:#89869a;font-size:.69rem}.week-toolbar .today{width:auto;margin-left:auto;padding:0 11px;font-size:.7rem;font-weight:750}.session-list{padding:0 18px}.session{display:grid;grid-template-columns:58px 145px minmax(0,1fr) auto;align-items:center;gap:15px;padding:15px 0;border-bottom:1px solid #efedf5}.session:last-child{border-bottom:0}.date{display:grid;justify-items:center;gap:1px;padding:6px;border-radius:10px;color:#6b65aa;background:#f2f1fc}.date b{text-transform:uppercase;font-size:.62rem;letter-spacing:.06em}.date strong{font-size:1.1rem}.date small{color:#8681b9;font-size:.64rem}.time strong,.time small{display:block}.time strong{font-size:.78rem}.time small{margin-top:5px;color:#8b899d;font-size:.7rem}.session-info h2{margin:0;font-size:.89rem}.session-info small{display:block;margin-top:4px;color:#7771b4;font-size:.68rem;font-weight:750}.session-info p{margin:5px 0 0;color:#8a6b3b;font-size:.7rem}.session-info p.class-name{margin:4px 0 0;color:#69667d;font-size:.68rem}.session>a{padding:8px 10px;border-radius:8px;color:#58528f;background:#f3f2fb;font-size:.7rem;font-weight:750;text-decoration:none;white-space:nowrap}.session>a:hover{background:#e8e6f8}.session.cancelled{opacity:.6}.empty{padding:55px 20px;color:#77758d;text-align:center}.empty span{color:#8981d0;font-size:2rem}.empty h2{margin:9px 0;color:#454361;font-size:1rem}.empty p{margin:0;font-size:.81rem}.loading{margin:0;padding:16px;color:#77758d;font-size:.8rem}.alert{margin:12px;padding:11px;border-radius:10px;color:#9b3836;background:#fff0ef;font-size:.82rem}@media(max-width:700px){.session-list{padding:0 13px}.session{grid-template-columns:48px minmax(100px,.7fr) minmax(0,1fr);gap:10px}.session>a{grid-column:2/-1;justify-self:start;margin-top:-3px}.time strong{font-size:.72rem}}@media(max-width:430px){.session{grid-template-columns:43px minmax(0,1fr);gap:8px}.date{grid-row:span 2}.time{grid-column:2}.session-info{grid-column:2}.session>a{grid-column:2}.week-toolbar{gap:7px;padding:12px}.week-toolbar .today{padding:0 7px;font-size:.64rem}.week-toolbar strong{font-size:.75rem}}
  `]
})
export class TeacherTimetableComponent implements OnInit {
  private readonly api = inject(TeacherApiService);
  readonly sessions = signal<TeacherSession[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private start = new Date();
  readonly weekStart = signal(new Date());
  readonly weekEnd = signal(new Date());

  ngOnInit() { this.goToday(); }
  moveWeek(days: number) {
    const next = new Date(this.start);
    next.setDate(next.getDate() + days);
    this.loadWeek(next);
  }
  goToday() {
    const today = new Date();
    today.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    this.loadWeek(today);
  }
  private loadWeek(start: Date) {
    this.start = new Date(start);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    this.weekStart.set(start);
    this.weekEnd.set(end);
    const date = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
    this.loading.set(true); this.error.set('');
    this.api.timetableWeek(date).subscribe({
      next: value => this.sessions.set(value.sessions.sort((a,b) => a.startsAt.localeCompare(b.startsAt))),
      error: () => { this.error.set('Impossible de charger votre emploi du temps.'); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }
  weekStartIso() {
    const date = this.weekStart();
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
}
