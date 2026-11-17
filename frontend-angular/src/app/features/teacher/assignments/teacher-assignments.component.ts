import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  TeacherApiService, TeacherAssignment, TeacherAssignmentDetail, TeacherCourse, TeacherWork
} from '../../../core/services/teacher-api.service';
import { validateUploadFile } from '../../../shared/validation/file-upload.validation';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page">
      <header class="page-head"><div><p class="eyebrow">ÉVALUATION &amp; SUIVI</p><h1>Devoirs et notes</h1><p>Créez des échéances et suivez le travail remis par vos étudiants.</p></div><button class="primary" type="button" (click)="newAssignment()">＋ Créer un devoir</button></header>
      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
      @if (formOpen()) {
        <form class="editor" (ngSubmit)="saveAssignment()">
          <div class="form-head"><div><p class="eyebrow">{{ editingId() ? 'MISE À JOUR' : 'NOUVELLE ÉCHÉANCE' }}</p><h2>{{ editingId() ? 'Modifier le devoir' : 'Créer un devoir' }}</h2></div><button type="button" class="close" (click)="closeForm()" aria-label="Fermer">×</button></div>
          <div class="form-grid">
            <label>Cours<select name="courseId" [(ngModel)]="courseId" required><option [ngValue]="null" disabled>Choisir un cours</option>@for (course of courses(); track course.id) { <option [ngValue]="course.id">{{ course.title }}</option> }</select></label>
            <label>Titre<input name="title" [(ngModel)]="title" maxlength="200" required /></label>
            <label>Échéance<input name="dueAt" type="datetime-local" [(ngModel)]="dueLocal" required /></label>
            <label>Barème maximal<input name="maxScore" type="number" min="0.01" max="9999.99" step="0.01" [(ngModel)]="maxScore" required /></label>
            <label class="wide">Consigne<textarea name="instructions" [(ngModel)]="instructions" rows="4" maxlength="20000"></textarea></label>
            <label class="wide">Pièce jointe facultative (PDF, DOCX, PPTX, JPG ou PNG · 10 MiB max)<input name="attachment" type="file" accept=".pdf,.docx,.pptx,.jpg,.png" (change)="selectAttachment($event)" /></label>
            @if (attachmentName) { <small class="attachment-preview">Fichier associé : {{ attachmentName }}@if (attachmentUrl) { · <a [href]="attachmentUrl" target="_blank" rel="noopener noreferrer">ouvrir ↗</a> }</small> }
          </div>
          <small class="hint">Les fichiers sont stockés en toute sécurité et limités à 10 MiB par fichier.</small>
          <div class="actions"><button class="primary" type="submit" [disabled]="saving() || !courses().length">{{ saving() ? 'Enregistrement…' : 'Enregistrer le devoir' }}</button><button type="button" class="secondary" (click)="closeForm()">Annuler</button></div>
        </form>
      }
      @if (loading()) { <p class="loading" role="status">Chargement des devoirs…</p> }
      @else if (!assignments().length) {
        <section class="empty"><span aria-hidden="true">✓</span><h2>Aucun devoir pour le moment</h2><p>Créez une échéance pour organiser le travail de vos cours.</p><button class="primary" type="button" (click)="newAssignment()">Créer le premier devoir</button></section>
      } @else {
        <div class="workspace">
          <section class="list-panel" aria-label="Liste des devoirs">
            <div class="list-heading"><div><p class="eyebrow">VOS ÉCHÉANCES</p><h2>{{ assignments().length }} devoir{{ assignments().length === 1 ? '' : 's' }}</h2></div></div>
            @for (assignment of assignments(); track assignment.id) {
              <button type="button" class="assignment" [class.selected]="selectedId() === assignment.id" (click)="openAssignment(assignment)">
                <span class="assignment-icon">✓</span><span class="assignment-copy"><strong>{{ assignment.title }}</strong><small>{{ assignment.courseTitle }}</small><time>À rendre le {{ assignment.dueAt | date:'d MMM y · HH:mm' }}</time></span><span class="arrow">›</span>
              </button>
            }
          </section>
          <section class="detail-panel" aria-label="Rendus des étudiants">
            @if (detailLoading()) { <p class="loading" role="status">Chargement des rendus…</p> }
            @else {
              @if (detail(); as current) {
              <header class="detail-head"><div><p class="eyebrow">{{ current.assignment.courseTitle }}</p><h2>{{ current.assignment.title }}</h2><p>{{ current.assignment.dueAt | date:'EEEE d MMMM y · HH:mm' }} <span>·</span> Barème {{ current.assignment.maxScore }}</p></div><button type="button" class="secondary" (click)="editAssignment(current.assignment)">Modifier</button></header>
              <div class="counts"><span><b>{{ current.submittedCount }}</b> Rendus</span><span><b>{{ current.missingCount }}</b> Non rendus</span></div>
              @if (current.submissions.length === 0) { <div class="empty compact"><h3>Aucun étudiant inscrit</h3><p>Les inscrits apparaîtront ici.</p></div> }
              @for (work of current.submissions; track work.studentId) {
                <article class="work" [class.missing]="!work.submitted">
                  <div class="student-mark">{{ work.firstName.charAt(0) }}{{ work.lastName.charAt(0) }}</div>
                  <div class="work-main">
                    <div class="work-heading"><div><strong>{{ work.firstName }} {{ work.lastName }}</strong><small>{{ work.email }}</small></div><span class="status" [class.done]="work.submitted">{{ work.submitted ? (work.status === 'GRADED' ? 'NOTÉ' : 'RENDU') : 'NON RENDU' }}</span></div>
                    @if (work.submitted) {
                      <p class="submitted">Déposé le {{ work.submittedAt | date:'d MMM y · HH:mm' }}</p>
                      @if (work.fileUrl) { <a class="file" [href]="work.fileUrl" target="_blank" rel="noopener noreferrer">{{ work.fileName || 'Ouvrir le travail' }} ↗</a> }
                      @if (work.comment) { <p class="comment">« {{ work.comment }} »</p> }
                      <div class="grade-form"><label>Note / {{ current.assignment.maxScore }}<input type="number" min="0" [max]="current.assignment.maxScore" step="0.01" [(ngModel)]="work.score" [name]="'score-' + work.studentId" /></label><label>Commentaire facultatif<input [(ngModel)]="work.feedback" [name]="'feedback-' + work.studentId" maxlength="20000" placeholder="Retour à l’étudiant" /></label><button class="primary" type="button" [disabled]="gradingId() === work.submissionId || work.score == null" (click)="grade(current.assignment.id, work)">{{ gradingId() === work.submissionId ? 'Enregistrement…' : (work.status === 'GRADED' ? 'Mettre à jour' : 'Enregistrer la note') }}</button></div>
                    } @else { <p class="missing-note">Aucun rendu enregistré pour cette échéance.</p> }
                  </div>
                </article>
              }
              } @else { <div class="empty detail-empty"><span aria-hidden="true">←</span><h2>Choisissez un devoir</h2><p>Les travaux remis et les étudiants en attente s’afficheront ici.</p></div> }
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1280px;margin:auto;color:#292a4d}*{box-sizing:border-box}.page{display:grid;gap:16px}.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.eyebrow{margin:0 0 7px;color:#7771b4;font-size:.67rem;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:2rem;letter-spacing:-.05em}.page-head p:last-child{margin:7px 0 0;color:#77758d;font-size:.88rem}.primary,.secondary{padding:10px 13px;border:0;border-radius:9px;font:inherit;font-size:.76rem;font-weight:750;cursor:pointer}.primary{color:white;background:#393575}.primary:hover{background:#2c2a61}.primary:disabled{opacity:.55;cursor:wait}.secondary{color:#514e76;background:#f0eff8}.editor{display:grid;gap:13px;padding:17px;border:1px solid #dcd9f1;border-radius:15px;background:#fff;box-shadow:0 5px 18px rgb(48 43 112 / 4%)}.form-head,.detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.form-head h2,.detail-head h2{margin:0;font-size:1.15rem}.close{width:32px;height:32px;border:0;border-radius:8px;color:#625b99;background:#efedf9;font-size:1.25rem;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.form-grid label,.grade-form label{display:grid;gap:6px;color:#4b4967;font-size:.74rem;font-weight:750}.form-grid input,.form-grid select,.form-grid textarea,.grade-form input{width:100%;min-width:0;padding:10px;border:1px solid #dedde9;border-radius:9px;color:#33324f;background:#fff;font:inherit;font-size:.82rem}.form-grid textarea{resize:vertical}.wide{grid-column:1/-1}.hint{color:#8a6b3b;font-size:.71rem}.actions{display:flex;gap:8px}.workspace{display:grid;grid-template-columns:minmax(260px,350px) minmax(0,1fr);gap:14px;align-items:start}.list-panel,.detail-panel{min-width:0;overflow:hidden;border:1px solid #e8e7f2;border-radius:16px;background:#fff;box-shadow:0 4px 14px rgb(48 43 112 / 3%)}.list-panel{position:sticky;top:15px}.list-heading{padding:16px}.list-heading h2{margin:0;font-size:1.05rem}.assignment{display:flex;width:100%;align-items:flex-start;gap:10px;padding:13px 15px;border:0;border-top:1px solid #f0eff5;color:inherit;background:#fff;text-align:left;cursor:pointer}.assignment:hover,.assignment.selected{background:#f8f7ff}.assignment.selected{box-shadow:inset 3px 0 #7066bf}.assignment-icon{display:grid;width:29px;height:29px;flex:0 0 auto;place-items:center;border-radius:8px;color:#675da9;background:#f0effb}.assignment-copy{min-width:0;flex:1}.assignment strong{display:block;font-size:.83rem}.assignment small,.assignment time{display:block;margin-top:4px;color:#858397;font-size:.7rem}.assignment time{color:#7771b4}.arrow{margin-left:auto;color:#918da8;font-size:1.2rem}.detail-panel{padding:19px}.detail-head{padding-bottom:13px;border-bottom:1px solid #efedf5}.detail-head h2{font-size:1.25rem}.detail-head p:last-child{margin:6px 0 0;color:#858397;font-size:.76rem}.detail-head p span{color:#bab6ce}.counts{display:flex;gap:9px;margin:12px 0}.counts span{padding:7px 10px;border-radius:8px;color:#716e86;background:#f4f3f9;font-size:.7rem}.counts b{margin-right:4px;color:#4c477c}.work{display:flex;gap:11px;padding:14px 0;border-top:1px solid #f0eff5}.work.missing{opacity:.82}.student-mark{display:grid;width:34px;height:34px;flex:0 0 auto;place-items:center;border-radius:10px;color:#5d568f;background:#efedf9;font-size:.7rem;font-weight:800}.work-main{min-width:0;flex:1}.work-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.work-heading strong,.work-heading small{display:block}.work-heading strong{font-size:.82rem}.work-heading small{margin-top:3px;color:#89869a;font-size:.68rem}.status{flex:0 0 auto;padding:4px 7px;border-radius:20px;color:#906127;background:#fff4e8;font-size:.6rem;font-weight:850;letter-spacing:.04em}.status.done{color:#36754f;background:#edf7f0}.submitted,.comment,.missing-note{margin:7px 0;color:#79768c;font-size:.73rem}.file{display:inline-block;margin:2px 0 6px;color:#554d99;font-size:.73rem;font-weight:700;overflow-wrap:anywhere}.comment{padding:8px;border-left:2px solid #d9d5f3;background:#faf9ff}.grade-form{display:grid;grid-template-columns:125px minmax(150px,1fr) auto;align-items:end;gap:8px;margin-top:9px}.grade-form label{font-size:.67rem}.grade-form input{padding:8px;font-size:.74rem}.grade-form button{white-space:nowrap}.missing-note{color:#a46b2d}.empty{padding:38px 20px;border:1px dashed #dedced;border-radius:16px;color:#77758d;background:#fff;text-align:center}.empty>span{color:#8981d0;font-size:1.8rem}.empty h2,.empty h3{margin:8px 0;color:#454361;font-size:1rem}.empty p{margin:0 0 12px;font-size:.81rem}.empty.compact{padding:24px}.detail-empty{min-height:300px;display:grid;align-content:center}.loading{margin:0;padding:13px;color:#77758d;font-size:.8rem}.alert,.notice{margin:0;padding:11px;border-radius:10px;font-size:.82rem}.alert{color:#9b3836;background:#fff0ef}.notice{color:#276b49;background:#edf8f1}@media(max-width:850px){.workspace{grid-template-columns:260px minmax(0,1fr)}.grade-form{grid-template-columns:1fr 1fr}.grade-form button{grid-column:1/-1}}@media(max-width:660px){.page-head{align-items:flex-start;flex-direction:column}.workspace{grid-template-columns:1fr}.list-panel{position:static}.detail-panel{padding:14px}.form-grid{grid-template-columns:1fr}.wide{grid-column:auto}.grade-form{grid-template-columns:1fr}.grade-form button{grid-column:auto}.work{gap:8px}.work-heading{flex-direction:column}.status{align-self:flex-start}}@media(max-width:380px){h1{font-size:1.65rem}.page-head>.primary{width:100%}.detail-head{flex-direction:column}}
  `]
})
export class TeacherAssignmentsComponent implements OnInit {
  private readonly api = inject(TeacherApiService);
  readonly assignments = signal<TeacherAssignment[]>([]);
  readonly courses = signal<TeacherCourse[]>([]);
  readonly detail = signal<TeacherAssignmentDetail | null>(null);
  readonly selectedId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly gradingId = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  courseId: number | null = null;
  title = '';
  instructions = '';
  dueLocal = '';
  maxScore = 100;
  attachmentName = '';
  attachmentUrl = '';
  selectedFile: File | null = null;

  ngOnInit() {
    this.api.courses().subscribe({ next: value => this.courses.set(value), error: () => this.error.set('Impossible de charger vos cours.') });
    this.reload();
  }
  reload() {
    this.loading.set(true);
    this.api.assignments().subscribe({
      next: values => {
        this.assignments.set(values);
        this.loading.set(false);
        if (values.length && this.selectedId() == null) this.openAssignment(values[0]);
      },
      error: () => { this.error.set('Impossible de charger les devoirs.'); this.loading.set(false); }
    });
  }
  openAssignment(assignment: TeacherAssignment) {
    this.selectedId.set(assignment.id);
    this.detailLoading.set(true);
    this.detail.set(null);
    this.api.assignment(assignment.id).subscribe({
      next: value => this.detail.set(value),
      error: () => { this.error.set('Impossible de charger les rendus de ce devoir.'); this.detailLoading.set(false); },
      complete: () => this.detailLoading.set(false)
    });
  }
  newAssignment() {
    this.resetForm();
    this.courseId = this.courses()[0]?.id ?? null;
    this.formOpen.set(true);
    this.notice.set('');
  }
  editAssignment(assignment: TeacherAssignment) {
    this.editingId.set(assignment.id);
    this.courseId = assignment.courseId;
    this.title = assignment.title;
    this.instructions = assignment.instructions ?? '';
    this.attachmentName = assignment.attachment?.fileName ?? '';
    this.attachmentUrl = assignment.attachment?.fileUrl ?? '';
    this.selectedFile = null;
    const date = new Date(assignment.dueAt);
    this.dueLocal = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    this.maxScore = assignment.maxScore;
    this.formOpen.set(true);
    this.notice.set('');
  }
  closeForm() { this.formOpen.set(false); this.resetForm(); }
  private resetForm() {
    this.editingId.set(null); this.courseId = null; this.title = ''; this.instructions = '';
    this.dueLocal = ''; this.maxScore = 100; this.attachmentName = ''; this.attachmentUrl = ''; this.selectedFile = null;
  }
  selectAttachment(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile = null;
    if (!file) return;
    const validation = validateUploadFile(file);
    if (validation) { this.error.set(validation); return; }
    this.selectedFile = file;
    this.attachmentName = file.name;
    this.attachmentUrl = '';
    this.error.set('');
  }
  saveAssignment() {
    if (!this.courseId || !this.dueLocal || this.saving()) return;
    this.saving.set(true); this.error.set('');
    const persist = (attachment: { fileName: string; fileUrl: string; contentType: string | null } | null) => {
      const body = {
        courseId: this.courseId, title: this.title, instructions: this.instructions,
        dueAt: new Date(this.dueLocal).toISOString(), maxScore: Number(this.maxScore), attachment
      };
      const edit = this.editingId();
      const request = edit ? this.api.updateAssignment(edit, body) : this.api.createAssignment(body);
      request.subscribe({
        next: assignment => {
          this.notice.set(edit ? 'Devoir modifié.' : 'Devoir créé.');
          this.closeForm(); this.reload(); this.openAssignment(assignment);
        },
        error: () => { this.error.set('Enregistrement impossible. Vérifiez le cours, l’échéance et les champs.'); this.saving.set(false); },
        complete: () => this.saving.set(false)
      });
    };
    if (this.selectedFile) {
      this.api.uploadFile(this.selectedFile).subscribe({
        next: file => { this.attachmentName = file.fileName; this.attachmentUrl = file.url; persist({ fileName: file.fileName, fileUrl: file.url, contentType: file.contentType ?? null }); },
        error: () => { this.error.set('Le téléversement a échoué. Vérifiez le type et la taille du fichier.'); this.saving.set(false); }
      });
    } else {
      persist(this.attachmentName && this.attachmentUrl
        ? { fileName: this.attachmentName, fileUrl: this.attachmentUrl, contentType: null }
        : null);
    }
  }
  grade(assignmentId: number, work: TeacherWork) {
    if (work.submissionId == null || work.score == null) return;
    this.gradingId.set(work.submissionId); this.error.set('');
    this.api.grade(assignmentId, work.submissionId, Number(work.score), work.feedback ?? '').subscribe({
      next: () => { this.notice.set(`Note enregistrée pour ${work.firstName} ${work.lastName}.`); const selected = this.assignments().find(a => a.id === assignmentId); if (selected) this.openAssignment(selected); },
      error: () => this.error.set('Note refusée : elle doit être comprise entre 0 et le barème maximal.'),
      complete: () => this.gradingId.set(null)
    });
  }
}
