import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TeacherApiService, TeacherAssignment, TeacherCourse, TeacherNotification, TeacherSession, TeacherProfile
} from '../../../core/services/teacher-api.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page">
      <section class="welcome">
        <div>
          <p class="eyebrow">ESPACE ENSEIGNANT <span>·</span> FST</p>
          <h1>Bonjour, {{ profile()?.firstName || 'enseignant' }}<span aria-hidden="true">.</span></h1>
          <p class="intro">Vos cours, vos séances et le suivi de vos étudiants, au même endroit.</p>
          <a class="primary" routerLink="/teacher/courses">Préparer mes cours <span aria-hidden="true">→</span></a>
        </div>
        <aside class="today">
          <span class="today-mark" aria-hidden="true">◷</span>
          <p class="eyebrow">À VENIR</p>
          @if (loading()) { <strong>Chargement de votre semaine…</strong> }
          @else if (sessions().length) {
            <strong>{{ sessions()[0].courseTitle }}</strong>
            <span>{{ sessions()[0].startsAt | date:'EEEE d MMMM · HH:mm' }}</span>
            <small>{{ sessions()[0].room || 'Salle à confirmer' }}</small>
          } @else { <strong>Votre agenda est libre.</strong><span>Aucune séance cette semaine.</span> }
        </aside>
      </section>
      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (loading()) { <p class="loading" role="status">Mise à jour de votre espace…</p> }
      <section class="stats" aria-label="Résumé">
        <a routerLink="/teacher/courses"><span class="stat-icon">▤</span><span><b>{{ loading() ? '…' : courses().length }}</b><small>Cours actifs</small></span><i>↗</i></a>
        <a routerLink="/teacher/assignments"><span class="stat-icon warm">✓</span><span><b>{{ loading() ? '…' : assignments().length }}</b><small>Devoirs à suivre</small></span><i>↗</i></a>
        <a routerLink="/teacher/notifications"><span class="stat-icon green">◇</span><span><b>{{ loading() ? '…' : unread() }}</b><small>Notifications non lues</small></span><i>↗</i></a>
      </section>
      <div class="columns">
        <section class="panel">
          <header><div><p class="eyebrow">SEMAINE EN COURS</p><h2>Prochaines séances</h2></div><a routerLink="/teacher/timetable">Emploi du temps ↗</a></header>
          @if (!loading() && sessions().length === 0) { <div class="empty"><b>Pas de séance planifiée</b><span>Votre emploi du temps apparaîtra ici.</span></div> }
          @for (session of sessions().slice(0, 4); track session.id) {
            <article class="row"><time>{{ session.startsAt | date:'EEE d MMM' }}<b>{{ session.startsAt | date:'HH:mm' }}</b></time><span class="line"></span><div><strong>{{ session.courseTitle }}</strong><small>{{ session.room || 'Salle à confirmer' }} · {{ session.endsAt | date:'HH:mm' }}</small></div></article>
          }
        </section>
        <section class="panel">
          <header><div><p class="eyebrow">À ORGANISER</p><h2>Échéances récentes</h2></div><a routerLink="/teacher/assignments">Tout voir ↗</a></header>
          @if (!loading() && assignments().length === 0) { <div class="empty"><b>Aucun devoir en cours</b><span>Créez un devoir pour le partager avec vos cours.</span></div> }
          @for (assignment of assignments().slice(0, 4); track assignment.id) {
            <a class="assignment" routerLink="/teacher/assignments"><span class="mini-mark">✓</span><span><strong>{{ assignment.title }}</strong><small>{{ assignment.courseTitle }}</small></span><time>{{ assignment.dueAt | date:'d MMM' }}</time></a>
          }
          @if (notifications().length > 0) { <a class="notification-link" routerLink="/teacher/notifications">{{ notifications()[0].title }}</a> }
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1220px;margin:auto;color:#292a4d}*{box-sizing:border-box}.page{display:grid;gap:18px}.welcome{position:relative;display:grid;grid-template-columns:1fr 250px;align-items:center;gap:20px;overflow:hidden;padding:28px 30px;border:1px solid #e8e6fa;border-radius:20px;background:linear-gradient(110deg,#fff 3%,#f7f6ff 100%);box-shadow:0 10px 30px rgb(48 43 112 / 5%)}.welcome:after{position:absolute;right:240px;bottom:-75px;width:210px;height:210px;border:1px solid #e7e4fb;border-radius:50%;content:"";pointer-events:none}.eyebrow{margin:0 0 9px;color:#7771b4;font-size:.67rem;font-weight:850;letter-spacing:.13em}.eyebrow span{color:#c1bde4}h1{margin:0;color:#29294c;font-size:clamp(1.7rem,3vw,2.4rem);letter-spacing:-.05em}h1 span{color:#8f84df}.intro{max-width:520px;margin:8px 0 18px;color:#6d6c84;font-size:.93rem}.primary{display:inline-flex;align-items:center;gap:12px;padding:11px 15px;border-radius:9px;color:#fff;background:#393575;text-decoration:none;font-size:.8rem;font-weight:750}.primary:hover{background:#2c2a61}.today{position:relative;z-index:1;display:grid;gap:6px;padding:17px;border:1px solid #eeecf9;border-radius:14px;background:#fff}.today-mark{color:#7a71ca;font-size:1.3rem}.today .eyebrow{margin:0}.today strong{font-size:.94rem}.today>span:not(.today-mark){color:#595680;font-size:.8rem}.today small{color:#8b899d}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.stats>a{display:flex;align-items:center;gap:13px;padding:16px;border:1px solid #e8e7f2;border-radius:14px;color:#2d2c50;background:#fff;text-decoration:none;box-shadow:0 4px 14px rgb(48 43 112 / 3%)}.stats>a:hover{border-color:#c8c3ef;transform:translateY(-1px)}.stat-icon{display:grid;width:38px;height:38px;place-items:center;border-radius:11px;color:#5a52a3;background:#f0effb;font-size:1.1rem}.stat-icon.warm{color:#a46b2d;background:#fff4e8}.stat-icon.green{color:#347953;background:#eaf5ee}.stats b{display:block;font-size:1.3rem}.stats small{display:block;margin-top:3px;color:#858397;font-size:.72rem}.stats i{margin-left:auto;color:#9a96b2;font-style:normal}.columns{display:grid;grid-template-columns:1fr 1fr;gap:15px}.panel{min-width:0;padding:19px;border:1px solid #e8e7f2;border-radius:16px;background:#fff;box-shadow:0 4px 14px rgb(48 43 112 / 3%)}.panel header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}.panel h2{margin:0;font-size:1.08rem;letter-spacing:-.025em}.panel header a{color:#716ab2;font-size:.74rem;font-weight:700;text-decoration:none;white-space:nowrap}    .row{display:flex;align-items:center;gap:13px;padding:12px 2px;border-top:1px solid #f0eff5}.row time{display:grid;min-width:66px;color:#686586;font-size:.71rem;text-align:right}.row time b{margin-top:3px;color:#3e3a72;font-size:.85rem}.line{position:relative;width:2px;height:34px;border-radius:2px;background:#e1def6}.line:after{position:absolute;top:7px;left:50%;width:7px;height:7px;border:2px solid #fff;border-radius:50%;background:#877ed0;box-shadow:0 0 0 2px #e9e6fb;content:"";transform:translateX(-50%)}.row strong,.assignment strong{display:block;font-size:.84rem}.row small,.assignment small{display:block;margin-top:4px;color:#858397;font-size:.72rem}.assignment{display:flex;align-items:center;gap:11px;padding:12px 0;border-top:1px solid #f0eff5;color:inherit;text-decoration:none}.assignment time{margin-left:auto;color:#7771b4;font-size:.75rem;font-weight:750}.mini-mark{display:grid;width:29px;height:29px;place-items:center;border-radius:8px;color:#6b62b6;background:#f2f1fc}.empty{display:grid;gap:6px;padding:25px 10px;color:#77758d;text-align:center}.empty b{color:#484664;font-size:.84rem}.empty span{font-size:.77rem}.notification-link{display:block;padding:9px 0 0;border-top:1px dashed #e6e4ef;color:#56518f;font-size:.75rem;text-decoration:none}.loading{margin:0;color:#77758d;font-size:.8rem}.alert{margin:0;padding:11px;border-radius:10px;color:#9b3836;background:#fff0ef;font-size:.82rem}@media(max-width:800px){.welcome{grid-template-columns:1fr 200px;padding:23px}.columns{grid-template-columns:1fr}}@media(max-width:560px){.welcome{grid-template-columns:1fr;padding:20px}.today{grid-template-columns:30px 1fr;align-items:center}.today .eyebrow{grid-column:2}.today strong,.today>span:not(.today-mark),.today small{grid-column:2}.today-mark{grid-row:1/5}.stats{grid-template-columns:1fr}.stats>a{padding:12px}.panel{padding:15px}.panel header{align-items:flex-start}.row{gap:9px}}
  `]
})
export class TeacherDashboardComponent implements OnInit {
  private readonly api = inject(TeacherApiService);
  readonly profile = signal<TeacherProfile | null>(null);
  readonly courses = signal<TeacherCourse[]>([]);
  readonly assignments = signal<TeacherAssignment[]>([]);
  readonly sessions = signal<TeacherSession[]>([]);
  readonly notifications = signal<TeacherNotification[]>([]);
  readonly unread = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const start = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    let remaining = 5;
    const finish = () => { if (--remaining === 0) this.loading.set(false); };
    const failed = () => { this.error.set('Certaines données ne sont pas disponibles pour le moment.'); finish(); };
    this.api.profile().subscribe({ next: value => this.profile.set(value), error: failed, complete: finish });
    this.api.courses().subscribe({ next: value => this.courses.set(value), error: failed, complete: finish });
    this.api.assignments().subscribe({ next: value => this.assignments.set(value), error: failed, complete: finish });
    this.api.timetableWeek(start).subscribe({
      next: value => this.sessions.set(value.sessions.filter(s => !s.cancelled).sort((a,b) => a.startsAt.localeCompare(b.startsAt))),
      error: failed, complete: finish
    });
    this.api.notifications().subscribe({
      next: value => { this.notifications.set(value); this.unread.set(value.filter(n => !n.read).length); },
      error: failed, complete: finish
    });
  }
}
