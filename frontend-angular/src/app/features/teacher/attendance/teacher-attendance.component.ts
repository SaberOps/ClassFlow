import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TeacherApiService, TeacherRoster, TeacherSession } from '../../../core/services/teacher-api.service';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="page">
      <header><p class="eyebrow">SUIVI DE L’ASSIDUITÉ</p><h1>Présences</h1><p>Consignez et corrigez la présence des inscrits à chacune de vos séances.</p></header>
      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
      <section class="panel">
        <div class="selector">
          <label for="week">Semaine du</label>
          <input id="week" type="date" [(ngModel)]="weekDate" (change)="changeWeek()" [disabled]="loadingSessions()" />
          <label for="session">Séance à traiter</label>
          <select id="session" [ngModel]="selectedId()" (ngModelChange)="selectSession($event)" [disabled]="loadingSessions() || !sessions().length">
            @if (!sessions().length) { <option [ngValue]="null">Aucune séance cette semaine</option> }
            @for (session of sessions(); track session.id) { <option [ngValue]="session.id">{{ session.startsAt | date:'EEE d MMM · HH:mm' }} — {{ session.courseTitle }}{{ session.room ? ' · ' + session.room : '' }}</option> }
          </select>
          <a routerLink="/teacher/timetable">Voir l’emploi du temps ↗</a>
        </div>
        @if (loadingSessions()) { <p class="loading" role="status">Chargement des séances…</p> }
        @else if (!sessions().length) { <div class="empty"><span aria-hidden="true">◷</span><h2>Aucune séance cette semaine</h2><p>Choisissez une autre semaine depuis l’emploi du temps pour retrouver une séance.</p></div> }
        @else if (loadingRoster()) { <p class="loading" role="status">Chargement de la liste des inscrits…</p> }
        @else {
         @if (roster(); as current) {
          <div class="roster-head"><div><p class="eyebrow">{{ current.courseTitle }}</p><h2>{{ current.startsAt | date:'EEEE d MMMM y' }} <span>·</span> {{ current.startsAt | date:'HH:mm' }}–{{ current.endsAt | date:'HH:mm' }}</h2><small>{{ current.room || 'Salle non précisée' }} · {{ current.students.length }} inscrits</small></div><button type="button" class="light" (click)="markAllPresent()">Tous présents</button></div>
          @if (!current.students.length) { <div class="empty compact"><h3>Aucun étudiant inscrit à ce cours</h3></div> }
          @for (student of current.students; track student.studentId) {
            <article class="student">
              <span class="avatar">{{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}</span>
              <span class="student-name"><strong>{{ student.firstName }} {{ student.lastName }}</strong><small>{{ student.email }}</small>@if (student.recordedAt) { <small class="stamp">Enregistré {{ student.recordedAt | date:'d MMM · HH:mm' }}@if (student.updatedAt) { <span> · Corrigé {{ student.updatedAt | date:'d MMM · HH:mm' }}</span> }</small> }</span>
              <label class="sr-only" [for]="'status-' + student.studentId">Statut de {{ student.firstName }} {{ student.lastName }}</label>
              <select [id]="'status-' + student.studentId" [(ngModel)]="student.status" [name]="'status-' + student.studentId">
                <option [ngValue]="null">À renseigner</option><option value="PRESENT">Présent</option><option value="ABSENT">Absent</option><option value="LATE">En retard</option>
              </select>
            </article>
          }
          @if (current.students.length) { <footer><span>Dernière sauvegarde : les corrections sont horodatées.</span><button type="button" class="primary" [disabled]="saving() || hasUnmarked()" (click)="save()">{{ saving() ? 'Enregistrement…' : 'Enregistrer la présence' }}</button></footer> }
         }
        }
      </section>
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1100px;margin:auto;color:#292a4d}*{box-sizing:border-box}.page{display:grid;gap:16px}header{margin-bottom:1px}.eyebrow{margin:0 0 7px;color:#7771b4;font-size:.67rem;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:2rem;letter-spacing:-.05em}header p:last-child{margin:7px 0 0;color:#77758d;font-size:.88rem}.panel{overflow:hidden;border:1px solid #e8e7f2;border-radius:16px;background:white;box-shadow:0 4px 14px rgb(48 43 112 / 3%)}    .selector{display:grid;grid-template-columns:110px minmax(0,1fr) 130px minmax(0,1.3fr) auto;align-items:center;gap:10px;padding:15px 18px;border-bottom:1px solid #efedf5;background:#fbfaff}.selector label{color:#4b4967;font-size:.76rem;font-weight:750}.selector input,.selector select,.student select{min-width:0;padding:10px;border:1px solid #dedde9;border-radius:9px;color:#33324f;background:white;font:inherit;font-size:.78rem}.selector a{color:#6b63aa;font-size:.7rem;font-weight:750;text-decoration:none;white-space:nowrap}.roster-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 18px 12px}.roster-head h2{margin:0;font-size:1.04rem}.roster-head h2 span{color:#c3bfd5}.roster-head small{display:block;margin-top:5px;color:#888597;font-size:.72rem}.light{padding:9px 11px;border:1px solid #e5e2f1;border-radius:9px;color:#615a98;background:#f7f6fc;font:inherit;font-size:.7rem;font-weight:750;cursor:pointer}.student{display:flex;align-items:center;gap:11px;padding:12px 18px;border-top:1px solid #f0eff5}.avatar{display:grid;width:34px;height:34px;flex:0 0 auto;place-items:center;border-radius:10px;color:#5d568f;background:#efedf9;font-size:.68rem;font-weight:800}.student-name{min-width:0;flex:1}.student-name strong,.student-name small{display:block}.student-name strong{font-size:.8rem}.student-name small{margin-top:3px;color:#89869a;font-size:.68rem;overflow-wrap:anywhere}.student-name .stamp{color:#aaa6b5;font-size:.63rem}.student select{width:128px}.student select:focus-visible,.selector select:focus-visible,.selector input:focus-visible,button:focus-visible{outline:3px solid #b5aff0;outline-offset:2px}footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-top:1px solid #efedf5;background:#fbfaff}footer span{color:#89869a;font-size:.69rem}.primary{padding:10px 14px;border:0;border-radius:9px;color:#fff;background:#393575;font:inherit;font-size:.74rem;font-weight:750;cursor:pointer}.primary:disabled{opacity:.5;cursor:not-allowed}.empty{padding:42px 18px;text-align:center;color:#77758d}.empty>span{color:#8981d0;font-size:1.8rem}.empty h2,.empty h3{margin:8px 0;color:#454361;font-size:.98rem}.empty p{margin:0;font-size:.78rem}.empty.compact{padding:25px}.loading{margin:0;padding:15px;color:#77758d;font-size:.8rem}.alert,.notice{margin:0;padding:11px;border-radius:10px;font-size:.82rem}.alert{color:#9b3836;background:#fff0ef}.notice{color:#276b49;background:#edf8f1}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:800px){.selector{grid-template-columns:110px minmax(0,1fr);}.selector a{grid-column:2}}@media(max-width:650px){.selector{grid-template-columns:1fr;gap:7px;padding:14px}.selector select,.selector input{width:100%}.roster-head{align-items:flex-start;padding:15px 13px}.student{gap:8px;padding:12px 11px;flex-wrap:wrap}.student-name{flex:1 1 calc(100% - 55px)}.student select{width:100%;margin-left:42px}footer{align-items:flex-start;flex-direction:column;padding:13px}.primary{width:100%}}
  `]
})
export class TeacherAttendanceComponent implements OnInit {
  private readonly api = inject(TeacherApiService);
  private readonly route = inject(ActivatedRoute);
  readonly sessions = signal<TeacherSession[]>([]);
  readonly selectedId = signal<number | null>(null);
  readonly roster = signal<TeacherRoster | null>(null);
  readonly loadingSessions = signal(true);
  readonly loadingRoster = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  weekDate = '';

  ngOnInit() {
    const queryStart = this.route.snapshot.queryParamMap.get('start');
    const monday = queryStart ? new Date(`${queryStart}T12:00:00`) : new Date();
    if (!queryStart) monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    this.weekDate = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
    this.loadSessions();
  }
  changeWeek() {
    const date = new Date(`${this.weekDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) return;
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    this.weekDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    this.selectedId.set(null);
    this.roster.set(null);
    this.loadSessions();
  }
  private loadSessions() {
    this.loadingSessions.set(true);
    this.api.timetableWeek(this.weekDate).subscribe({
      next: value => {
        this.sessions.set(value.sessions.filter(s => !s.cancelled).sort((a,b) => a.startsAt.localeCompare(b.startsAt)));
        this.loadingSessions.set(false);
        const requested = Number(this.route.snapshot.queryParamMap.get('session'));
        const initial = this.sessions().find(s => s.id === requested) ?? this.sessions()[0];
        if (initial) this.selectSession(initial.id);
      },
      error: () => { this.error.set('Impossible de charger vos séances.'); this.loadingSessions.set(false); }
    });
  }
  selectSession(id: number) {
    if (!id) return;
    this.selectedId.set(id); this.roster.set(null); this.loadingRoster.set(true); this.error.set('');
    this.api.roster(id).subscribe({
      next: value => this.roster.set(value),
      error: () => { this.error.set('Impossible de charger cette liste de présence.'); this.loadingRoster.set(false); },
      complete: () => this.loadingRoster.set(false)
    });
  }
  markAllPresent() {
    const current = this.roster();
    if (current) current.students.forEach(student => student.status = 'PRESENT');
  }
  hasUnmarked() { return this.roster()?.students.some(student => !student.status) ?? false; }
  save() {
    const current = this.roster();
    if (!current || this.saving() || current.students.some(student => !student.status)) return;
    this.saving.set(true); this.error.set(''); this.notice.set('');
    const entries = current.students.map(student => ({ studentId: student.studentId, status: student.status! }));
    this.api.saveAttendance(current.sessionId, entries).subscribe({
      next: value => { this.roster.set(value); this.notice.set('Présences enregistrées. Les corrections sont horodatées.'); },
      error: () => { this.error.set('Impossible d’enregistrer les présences. Réessayez.'); this.saving.set(false); },
      complete: () => this.saving.set(false)
    });
  }
}
