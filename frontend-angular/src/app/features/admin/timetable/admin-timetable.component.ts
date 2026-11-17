import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AdminTimetableOptions,
  AdminTimetableSession,
  AdminTimetableService,
  TimetableSessionPayload
} from './admin-timetable.service';

interface DayGroup {
  date: Date;
  sessions: AdminTimetableSession[];
}

interface SessionDraft {
  courseId: number | null;
  classId: number | null;
  teacherId: number | null;
  startsAt: string;
  endsAt: string;
  room: string;
}

function emptyDraft(): SessionDraft {
  return { courseId: null, classId: null, teacherId: null, startsAt: '', endsAt: '', room: '' };
}

@Component({
  selector: 'app-admin-timetable',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <main class="timetable-page">
      <header class="page-header">
        <div>
          <a class="back-link" routerLink="/admin/home">← Tableau de bord</a>
          <p class="eyebrow">ORGANISATION ACADÉMIQUE</p>
          <h1>Emploi du temps</h1>
          <p class="intro">Planifiez les séances et coordonnez les classes, les enseignants et les salles.</p>
        </div>
        <div class="publication-note"><span class="live-dot" aria-hidden="true"></span>
          Les séances enregistrées sont publiées immédiatement
        </div>
      </header>

      <div class="workspace">
        <section class="agenda panel" aria-labelledby="agenda-title">
          <div class="agenda-heading">
            <div>
              <p class="eyebrow">VUE HEBDOMADAIRE</p>
              <h2 id="agenda-title">Agenda des séances</h2>
            </div>
            <div class="week-controls" aria-label="Navigation dans l’agenda">
              <button type="button" class="icon-button" aria-label="Semaine précédente" (click)="moveWeek(-7)">←</button>
              <button type="button" class="today-button" (click)="goToday()">Cette semaine</button>
              <button type="button" class="icon-button" aria-label="Semaine suivante" (click)="moveWeek(7)">→</button>
            </div>
          </div>
          <div class="week-range">{{ formatRange() }}</div>

          @if (weekLoading()) {
            <p class="status loading" role="status">Chargement de l’agenda…</p>
          } @else if (weekError()) {
            <div class="status error" role="alert">
              <span>{{ weekError() }}</span>
              <button type="button" class="text-button" (click)="loadWeek()">Réessayer</button>
            </div>
          } @else if (!sessions().length) {
            <div class="empty-state">
              <span class="empty-mark" aria-hidden="true">▦</span>
              <h3>Aucune séance cette semaine</h3>
              <p>Les nouvelles séances apparaîtront ici après leur enregistrement.</p>
              <button type="button" class="text-button" (click)="startNewSession()">Créer une séance</button>
            </div>
          } @else {
            <div class="day-list">
              @for (group of days(); track dayKey(group.date)) {
                <section class="day-group" [class.today]="isToday(group.date)" [attr.aria-label]="formatDay(group.date)">
                  <div class="day-marker">
                    <span>{{ formatWeekday(group.date) }}</span>
                    <strong>{{ group.date | date:'d' }}</strong>
                    <small>{{ formatMonth(group.date) }}</small>
                  </div>
                  <div class="day-sessions">
                    @for (session of group.sessions; track session.id) {
                      <article class="session-row" [class.cancelled]="session.cancelled">
                        <div class="session-time">
                          <strong>{{ formatTime(session.startsAt) }}</strong>
                          <span>{{ formatTime(session.endsAt) }}</span>
                        </div>
                        <div class="session-details">
                          <div class="course-line">
                            <h3>{{ session.courseTitle }}</h3>
                            @if (session.cancelled) { <span class="cancelled-tag">Annulée</span> }
                          </div>
                          <p>{{ session.className }} <span aria-hidden="true">·</span> {{ session.teacherName }}</p>
                          <small>{{ session.room || 'Salle à confirmer' }}</small>
                        </div>
                        <div class="session-actions">
                          <button type="button" class="edit-button" (click)="editSession(session)">Modifier</button>
                          <button type="button" class="delete-button" [disabled]="deletingId() !== null" (click)="deleteSession(session)">
                            {{ deletingId() === session.id ? 'Suppression…' : 'Supprimer' }}
                          </button>
                        </div>
                      </article>
                    }
                  </div>
                </section>
              }
            </div>
          }
        </section>

        <aside class="editor panel" aria-labelledby="editor-title">
          <div class="editor-heading">
            <div class="editor-icon" aria-hidden="true">{{ editingId() ? '✎' : '+' }}</div>
            <div>
              <p class="eyebrow">{{ editingId() ? 'MISE À JOUR' : 'NOUVELLE SÉANCE' }}</p>
              <h2 id="editor-title">{{ editingId() ? 'Modifier la séance' : 'Planifier une séance' }}</h2>
            </div>
          </div>
          <p class="editor-intro">Renseignez les informations de cours et son créneau.</p>

          @if (optionsLoading()) {
            <p class="status loading" role="status">Chargement des options…</p>
          } @else if (optionsError()) {
            <div class="status error" role="alert">
              <span>{{ optionsError() }}</span>
              <button type="button" class="text-button" (click)="loadOptions()">Réessayer</button>
            </div>
          } @else if (options()) {
            <form (ngSubmit)="save()" #sessionForm="ngForm">
              <label for="course">Cours <span aria-hidden="true">*</span></label>
              <select id="course" name="courseId" required [(ngModel)]="draft.courseId" (ngModelChange)="onCourseChange()">
                <option [ngValue]="null" disabled>Choisir un cours</option>
                @for (course of options()!.courses; track course.id) {
                  <option [ngValue]="course.id">{{ course.code }} · {{ course.title }}</option>
                }
              </select>

              <label for="class">Classe <span aria-hidden="true">*</span></label>
              <select id="class" name="classId" required [(ngModel)]="draft.classId">
                <option [ngValue]="null" disabled>Choisir une classe</option>
                @for (classItem of options()!.classes; track classItem.id) {
                  <option [ngValue]="classItem.id">{{ classItem.name }}</option>
                }
              </select>

              <label for="teacher">Enseignant <span aria-hidden="true">*</span></label>
              <select id="teacher" name="teacherId" required [(ngModel)]="draft.teacherId">
                <option [ngValue]="null" disabled>Choisir un enseignant</option>
                @for (teacher of options()!.teachers; track teacher.id) {
                  <option [ngValue]="teacher.id">{{ teacher.firstName }} {{ teacher.lastName }}</option>
                }
              </select>
              <p class="field-hint">L’enseignant est proposé automatiquement selon le cours, et peut être modifié.</p>

              <div class="time-fields">
                <div>
                  <label for="startsAt">Début <span aria-hidden="true">*</span></label>
                  <input id="startsAt" name="startsAt" type="datetime-local" required [(ngModel)]="draft.startsAt">
                </div>
                <div>
                  <label for="endsAt">Fin <span aria-hidden="true">*</span></label>
                  <input id="endsAt" name="endsAt" type="datetime-local" required [(ngModel)]="draft.endsAt">
                </div>
              </div>

              <label for="room">Salle</label>
              <input id="room" name="room" type="text" maxlength="80" placeholder="Ex. Bâtiment A · Salle 204" [(ngModel)]="draft.room">

              @if (formError()) { <p class="form-error" role="alert">{{ formError() }}</p> }
              @if (notice()) { <p class="form-success" role="status">{{ notice() }}</p> }

              <div class="form-actions">
                @if (editingId()) {
                  <button type="button" class="secondary-button" [disabled]="saving()" (click)="startNewSession()">Annuler</button>
                }
                <button type="submit" class="save-button" [disabled]="saving() || sessionForm.invalid">
                  {{ saving() ? 'Enregistrement…' : (editingId() ? 'Enregistrer les modifications' : 'Créer la séance') }}
                </button>
              </div>
            </form>
          }
        </aside>
      </div>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f7f8fc;color:#292a4d;font-family:inherit}
    *{box-sizing:border-box}
    .timetable-page{width:min(1440px,100%);margin:0 auto;padding:34px clamp(18px,4vw,58px) 56px}
    .page-header{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:26px}
    .back-link{display:inline-block;margin-bottom:20px;color:#625ba5;font-size:.76rem;font-weight:750;text-decoration:none}
    .back-link:hover{text-decoration:underline}
    .eyebrow{margin:0 0 7px;color:#7771b4;font-size:.7rem;font-weight:850;letter-spacing:.14em}
    h1{margin:0;color:#292a4d;font-size:clamp(1.75rem,3vw,2.25rem);letter-spacing:-.045em}
    .intro{margin:8px 0 0;color:#77758d;font-size:.88rem}
    .publication-note{display:flex;align-items:center;gap:9px;max-width:310px;padding:11px 14px;border:1px solid #e6e5f1;border-radius:10px;background:#fff;color:#5d5a77;font-size:.75rem;line-height:1.45}
    .live-dot{width:8px;height:8px;flex:none;border-radius:50%;background:#56a881;box-shadow:0 0 0 4px #eaf5ef}
    .workspace{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(310px,.8fr);align-items:start;gap:20px}
    .panel{border:1px solid #e8e7f2;border-radius:15px;background:#fff;box-shadow:0 6px 24px rgb(48 43 112 / 3%)}
    .agenda{overflow:hidden}
    .agenda-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 22px 10px}
    .agenda-heading h2,.editor-heading h2{margin:0;font-size:1.04rem;letter-spacing:-.02em}
    .week-controls{display:flex;align-items:center;gap:7px}
    .icon-button,.today-button{height:34px;border:1px solid #e5e3ef;border-radius:8px;background:#fff;color:#57528f;cursor:pointer}
    .icon-button{width:34px;font-size:1.05rem}
    .today-button{padding:0 11px;font-size:.76rem;font-weight:750}
    button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b9b4ec;outline-offset:2px}
    button:disabled{opacity:.55;cursor:not-allowed}
    .week-range{padding:0 22px 16px;color:#77758d;font-size:.76rem}
    .day-list{padding:2px 22px 12px}
    .day-group{position:relative;display:grid;grid-template-columns:58px minmax(0,1fr);gap:14px;padding:14px 0;border-top:1px solid #efedf5}
    .day-group::before{position:absolute;top:14px;bottom:14px;left:25px;width:2px;border-radius:2px;background:#e8e5f7;content:""}
    .day-marker{position:relative;z-index:1;display:grid;align-content:start;justify-items:center;gap:2px;width:51px;height:66px;padding:6px 3px;border:1px solid #e7e4f5;border-radius:11px;background:#f2f1fc;color:#6b65aa;box-shadow:0 0 0 4px #fff}
    .day-group.today .day-marker{border-color:#d5d0f0;background:#eae8fa;color:#504a91}
    .day-marker span{font-size:.75rem;font-weight:850;letter-spacing:.05em;text-transform:uppercase}
    .day-marker strong{font-size:1.2rem;line-height:1.15}
    .day-marker small{color:#7771a9;font-size:.75rem}
    .day-sessions{min-width:0}
    .session-row{display:grid;grid-template-columns:72px minmax(0,1fr) auto;align-items:center;gap:12px;padding:0 0 13px;margin:0 0 13px;border-bottom:1px solid #f1eff6}
    .session-row:last-child{padding-bottom:0;margin-bottom:0;border-bottom:0}
    .session-time{display:grid;gap:3px;padding-left:9px;border-left:2px solid #dcd8f3;color:#4f4b77;font-variant-numeric:tabular-nums}
    .session-time strong{font-size:.8rem}
    .session-time span{color:#77758d;font-size:.75rem}
    .session-details{min-width:0}
    .course-line{display:flex;align-items:center;flex-wrap:wrap;gap:7px}
    .course-line h3{overflow:hidden;margin:0;color:#32324f;font-size:.82rem;font-weight:780;text-overflow:ellipsis}
    .session-details p{margin:5px 0 2px;color:#6d6a80;font-size:.75rem}
    .session-details small{color:#77758d;font-size:.75rem}
    .cancelled-tag{padding:3px 6px;border-radius:5px;background:#fff0ef;color:#a3413d;font-size:.75rem;font-weight:750}
    .session-row.cancelled .session-details,.session-row.cancelled .session-time{opacity:.62}
    .session-actions{display:flex;gap:5px}
    .edit-button,.delete-button{padding:7px 9px;border:0;border-radius:7px;background:#f3f2fb;color:#5d5795;font-size:.75rem;font-weight:750;cursor:pointer}
    .edit-button:hover{background:#e8e6f8}
    .delete-button{background:#fff4f3;color:#a44945}
    .delete-button:hover{background:#ffe9e7}
    .empty-state{display:grid;justify-items:center;padding:56px 20px 62px;text-align:center}
    .empty-mark{display:grid;width:44px;height:44px;place-items:center;border-radius:13px;background:#f1f0fc;color:#7771b4;font-size:1.4rem}
    .empty-state h3{margin:13px 0 5px;color:#393953;font-size:.94rem}
    .empty-state p{max-width:270px;margin:0;color:#858298;font-size:.76rem;line-height:1.55}
    .text-button{padding:4px 0;border:0;background:transparent;color:#5f58a0;font-size:.75rem;font-weight:750;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
    .empty-state .text-button{margin-top:12px}
    .editor{padding:20px}
    .editor-heading{display:flex;align-items:center;gap:11px}
    .editor-heading .eyebrow{margin-bottom:4px}
    .editor-heading h2{font-size:.98rem}
    .editor-icon{display:grid;width:38px;height:38px;flex:none;place-items:center;border-radius:11px;background:#efedfc;color:#615ba5;font-size:1.25rem;font-weight:700}
    .editor-intro{margin:13px 0 18px;color:#77758d;font-size:.78rem;line-height:1.5}
    form{display:grid}
    label{margin:12px 0 6px;color:#4e4b66;font-size:.78rem;font-weight:750}
    label span{color:#8b63ac}
    select,input{width:100%;min-width:0;height:41px;padding:0 10px;border:1px solid #e4e3ed;border-radius:8px;background:#fff;color:#393850;font:inherit;font-size:.8rem}
    select:focus,input:focus{border-color:#a9a3df}
    input::placeholder{color:#aaa7b7}
    .field-hint{margin:6px 0 0;color:#77758d;font-size:.75rem;line-height:1.45}
    .time-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:11px}.time-fields>div{min-width:0}
    .time-fields input{padding:0 7px;font-size:.78rem}
    .form-error,.form-success{margin:14px 0 0;padding:10px 11px;border-radius:8px;font-size:.77rem;line-height:1.45}
    .form-error,.status.error{background:#fff0ef;color:#993f3a}
    .form-success{background:#eff8f2;color:#34764e}
    .form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
    .save-button,.secondary-button{min-height:40px;padding:0 13px;border:1px solid transparent;border-radius:8px;font-size:.77rem;font-weight:750;cursor:pointer}
    .save-button{background:#554da0;color:#fff}
    .save-button:hover:not(:disabled){background:#443c89}
    .secondary-button{border-color:#e4e2ed;background:#fff;color:#5d5976}
    .status{margin:13px 18px;padding:12px;border-radius:9px;font-size:.78rem;line-height:1.5}
    .status.loading{background:#f6f5fb;color:#716d88}
    .status.error{display:flex;justify-content:space-between;align-items:center;gap:10px}
    .editor .status{margin:10px 0}
    @media(max-width:980px){.workspace{grid-template-columns:minmax(0,1.25fr) minmax(290px,.85fr);gap:14px}.day-list{padding-right:16px;padding-left:16px}.agenda-heading{padding-right:16px;padding-left:16px}.week-range{padding-left:16px}.day-group{grid-template-columns:48px minmax(0,1fr);gap:10px}.day-group::before{left:22px}.day-marker{width:45px}.session-row{grid-template-columns:62px minmax(0,1fr);gap:9px}.session-actions{grid-column:2;justify-self:start;margin-top:-3px}}
    @media(max-width:760px){.timetable-page{padding-top:24px}.page-header{align-items:flex-start;flex-direction:column;gap:14px}.back-link{margin-bottom:14px}.publication-note{max-width:none}.workspace{grid-template-columns:1fr}.editor{grid-row:1}.agenda{grid-row:2}}
    @media(max-width:440px){.timetable-page{padding-right:13px;padding-left:13px}.agenda-heading{display:grid;grid-template-columns:minmax(0,1fr);align-items:start;gap:12px}.week-controls{grid-row:2;align-self:start;justify-self:end;margin:0}.agenda-heading h2{font-size:.98rem}.day-list{padding-right:12px;padding-left:12px}.day-group{grid-template-columns:42px minmax(0,1fr);gap:8px}.day-group::before{left:20px}.day-marker{width:40px;height:61px}.session-row{grid-template-columns:55px minmax(0,1fr);gap:7px}.session-actions{gap:4px}.edit-button,.delete-button{padding:7px 8px;font-size:.75rem}.session-details p{line-height:1.4}.time-fields{gap:7px}.time-fields input{font-size:.75rem}}
  `]
})
export class AdminTimetableComponent implements OnInit {
  private readonly api = inject(AdminTimetableService);
  readonly options = signal<AdminTimetableOptions | null>(null);
  readonly sessions = signal<AdminTimetableSession[]>([]);
  readonly optionsLoading = signal(true);
  readonly weekLoading = signal(true);
  readonly optionsError = signal('');
  readonly weekError = signal('');
  readonly formError = signal('');
  readonly notice = signal('');
  readonly saving = signal(false);
  readonly deletingId = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly weekStart = signal(AdminTimetableComponent.monday(new Date()));
  readonly weekEnd = computed(() => {
    const end = new Date(this.weekStart());
    end.setDate(end.getDate() + 6);
    return end;
  });
  readonly days = computed<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();
    for (const session of this.sessions()) {
      const date = new Date(session.startsAt);
      const key = AdminTimetableComponent.localDateKey(date);
      let group = groups.get(key);
      if (!group) {
        group = { date, sessions: [] };
        groups.set(key, group);
      }
      group.sessions.push(session);
    }
    return [...groups.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  });
  draft = emptyDraft();

  ngOnInit(): void {
    this.loadOptions();
    this.loadWeek();
  }

  loadOptions(): void {
    this.optionsLoading.set(true);
    this.optionsError.set('');
    this.api.options().subscribe({
      next: value => this.options.set(value),
      error: error => {
        this.optionsError.set(this.errorMessage(error, 'Impossible de charger les cours, classes et enseignants.'));
        this.optionsLoading.set(false);
      },
      complete: () => this.optionsLoading.set(false)
    });
  }

  loadWeek(): void {
    this.weekLoading.set(true);
    this.weekError.set('');
    this.api.week(AdminTimetableComponent.localDateKey(this.weekStart())).subscribe({
      next: value => this.sessions.set([...value.sessions].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )),
      error: error => {
        this.weekError.set(this.errorMessage(error, 'Impossible de charger l’emploi du temps.'));
        this.weekLoading.set(false);
      },
      complete: () => this.weekLoading.set(false)
    });
  }

  moveWeek(days: number): void {
    const next = new Date(this.weekStart());
    next.setDate(next.getDate() + days);
    this.weekStart.set(next);
    this.loadWeek();
  }

  goToday(): void {
    this.weekStart.set(AdminTimetableComponent.monday(new Date()));
    this.loadWeek();
  }

  onCourseChange(): void {
    const selected = this.options()?.courses.find(course => course.id === this.draft.courseId);
    this.draft.teacherId = selected?.teacherId ?? null;
  }

  startNewSession(): void {
    this.editingId.set(null);
    this.draft = emptyDraft();
    this.formError.set('');
    this.notice.set('');
  }

  editSession(session: AdminTimetableSession): void {
    this.editingId.set(session.id);
    this.formError.set('');
    this.notice.set('');
    this.draft = {
      courseId: session.courseId,
      classId: session.classId,
      teacherId: session.teacherId,
      startsAt: this.toLocalInput(session.startsAt),
      endsAt: this.toLocalInput(session.endsAt),
      room: session.room ?? ''
    };
  }

  save(): void {
    if (this.saving()) return;
    this.formError.set('');
    this.notice.set('');
    if (this.draft.courseId === null || this.draft.classId === null || this.draft.teacherId === null
      || !this.draft.startsAt || !this.draft.endsAt) {
      this.formError.set('Complétez tous les champs obligatoires.');
      return;
    }
    const startsAt = new Date(this.draft.startsAt);
    const endsAt = new Date(this.draft.endsAt);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
      this.formError.set('L’heure de fin doit être postérieure à l’heure de début.');
      return;
    }
    const payload: TimetableSessionPayload = {
      courseId: this.draft.courseId,
      classId: this.draft.classId,
      teacherId: this.draft.teacherId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      room: this.draft.room.trim()
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id === null ? this.api.create(payload) : this.api.update(id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.startNewSession();
        this.notice.set(id === null ? 'Séance créée et publiée.' : 'Modifications enregistrées.');
        this.loadWeek();
      },
      error: error => {
        this.formError.set(this.errorMessage(error, 'Impossible d’enregistrer la séance.'));
        this.saving.set(false);
      }
    });
  }

  deleteSession(session: AdminTimetableSession): void {
    if (this.deletingId() !== null) return;
    const confirmed = window.confirm(`Supprimer la séance « ${session.courseTitle} » du ${this.formatDay(new Date(session.startsAt))} ?`);
    if (!confirmed) return;
    this.formError.set('');
    this.notice.set('');
    this.deletingId.set(session.id);
    this.api.delete(session.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        if (this.editingId() === session.id) this.startNewSession();
        this.notice.set('Séance supprimée.');
        this.loadWeek();
      },
      error: error => {
        this.deletingId.set(null);
        this.weekError.set(this.errorMessage(error, 'Impossible de supprimer la séance.'));
      }
    });
  }

  dayKey(date: Date): string {
    return AdminTimetableComponent.localDateKey(date);
  }

  isToday(date: Date): boolean {
    return this.dayKey(date) === AdminTimetableComponent.localDateKey(new Date());
  }

  formatDay(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  }

  formatRange(): string {
    const format = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
    const year = new Intl.DateTimeFormat('fr-FR', { year: 'numeric' });
    return `${format.format(this.weekStart())} — ${format.format(this.weekEnd())} ${year.format(this.weekEnd())}`;
  }

  formatWeekday(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', '');
  }

  formatMonth(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '');
  }

  formatTime(value: string): string {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  }

  private toLocalInput(value: string): string {
    const date = new Date(value);
    const pad = (number: number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private errorMessage(error: unknown, fallback: string): string {
    const response = error as { status?: number; error?: { detail?: unknown; message?: unknown; title?: unknown } };
    const detail = response?.error?.detail ?? response?.error?.message ?? response?.error?.title;
    let message = typeof detail === 'string' && detail.trim() ? detail
      : response?.status === 409 ? 'Conflit de planning : ce créneau chevauche une autre séance. Vérifiez la classe, l’enseignant et la salle.'
      : response?.status === 400 ? 'Les informations de la séance sont invalides. Vérifiez les champs puis réessayez.'
      : response?.status === 0 ? 'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.'
      : fallback;
    if (response?.status && response.status >= 500) message += ` (Erreur serveur HTTP ${response.status}).`;
    return message;
  }

  private static monday(date: Date): Date {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return monday;
  }

  private static localDateKey(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
