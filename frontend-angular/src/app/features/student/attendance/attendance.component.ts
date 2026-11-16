import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentApiService } from '../../../core/services/student-api.service';
import { AbsenceJustification, AttendanceOverview } from '../../../shared/models/student.model';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <header><p class="eyebrow">SUIVI PÉDAGOGIQUE</p><h1>Présences et absences</h1><p>Consultez votre assiduité par cours et suivez vos justificatifs.</p></header>
    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
    @if (loading()) { <p role="status">Chargement des données…</p> }
    @if (data(); as d) {
      <section class="summary">
        @for (c of d.byCourse; track c.courseId) {
          <article><strong>{{ c.courseTitle }}</strong><div class="rate">{{ c.presenceRate }}%</div><small>{{ c.present }} présence(s) · {{ c.absent }} absence(s) · {{ c.late }} retard(s)</small><div class="bar"><span [style.width.%]="c.presenceRate"></span></div></article>
        }
      </section>
      <section class="panel"><h2>Historique</h2>
        @for (h of d.history; track h.id) {
          <article class="history"><div><strong>{{ h.courseTitle }}</strong><small>{{ h.sessionStartsAt | date:'d MMM yyyy, HH:mm' }}</small></div><span class="status" [class.absent]="h.status==='ABSENT'">{{ h.status }}</span>
            @if (h.status==='ABSENT') {
              @if (!hasJustification(h.id)) { <button type="button" (click)="selectAbsence(h.id)">Justifier</button> }
              @else { <small class="submitted">Justificatif envoyé</small> }
            }
          </article>
        }
        @if (d.history.length===0) { <p class="muted">Aucun enregistrement de présence.</p> }
      </section>
      @if (selectedAbsenceId()) {
        <section class="panel form-panel"><h2>Déposer un justificatif</h2><p class="muted">Ajoutez le nom du document et un lien accessible vers le fichier, puis envoyez votre demande.</p>
          <form (ngSubmit)="submitJustification()">
            <label>Nom du document<input name="fileName" [(ngModel)]="fileName" required maxlength="255" /></label>
            <label>Lien du document<input name="fileUrl" [(ngModel)]="fileUrl" type="url" required /></label>
            <label>Commentaire (facultatif)<textarea name="comment" [(ngModel)]="comment" rows="2" maxlength="1000"></textarea></label>
            <div><button type="submit" [disabled]="sending()">Envoyer le justificatif</button><button type="button" class="secondary" (click)="cancel()">Annuler</button></div>
          </form>
        </section>
      }
    }
    <section class="panel"><h2>Mes justificatifs</h2>
      @for (j of justifications(); track j.id) {
        <article class="history"><div><strong>{{ j.courseTitle || 'Absence' }}</strong><small>{{ j.submittedAt | date:'d MMM yyyy' }} · {{ j.fileName }}</small></div><span class="status">{{ j.status }}</span><a [href]="j.fileUrl" target="_blank" rel="noopener">Ouvrir</a></article>
      }
      @if (!loading() && justifications().length===0) { <p class="muted">Aucun justificatif envoyé.</p> }
    </section>
  `,
  styles: [`
    :host{display:block;max-width:1100px;margin:auto;color:#172033}header{margin-bottom:22px}h1{font-size:2rem;margin:5px 0}.eyebrow{font-size:.72rem;letter-spacing:.12em;color:#63809e;font-weight:800}header p:last-child,.muted{color:#718096}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:18px}.summary article,.panel{background:white;border:1px solid #e5ebf2;border-radius:15px;padding:18px}.summary strong{display:block}.rate{font-size:1.8rem;font-weight:800;color:#245b89;margin:8px 0}.summary small,.history small{display:block;color:#7c8998;margin-top:4px}.bar{height:6px;background:#edf1f5;border-radius:9px;margin-top:12px;overflow:hidden}.bar span{display:block;height:100%;background:#398b69}.panel{margin-bottom:16px}.panel h2{font-size:1.15rem;margin:0 0 12px}.history{display:flex;align-items:center;gap:14px;padding:13px 0;border-top:1px solid #edf0f4}.history>div{flex:1}.status{font-size:.75rem;font-weight:800;padding:6px 9px;border-radius:8px;background:#eaf5ee;color:#28724a}.status.absent{background:#fff0ef;color:#a63c32}.history button,.form-panel button{border:0;border-radius:9px;background:#173b60;color:white;padding:9px 12px;font-weight:700;cursor:pointer}.submitted{color:#28724a}.history a{color:#2463a5;text-decoration:none}.form-panel form{display:grid;gap:12px}.form-panel label{display:grid;gap:6px;font-weight:700}.form-panel input,.form-panel textarea{padding:10px;border:1px solid #d8e0e9;border-radius:9px;font:inherit}.form-panel form>div{display:flex;gap:8px}.form-panel .secondary{background:#edf2f7;color:#30445a}.error{padding:10px;background:#fff1f0;color:#a3332b;border-radius:10px}@media(max-width:600px){.history{align-items:flex-start;flex-wrap:wrap}.history>div{flex-basis:100%}}
  `]
})
export class AttendanceComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly data = signal<AttendanceOverview | null>(null);
  readonly justifications = signal<AbsenceJustification[]>([]);
  readonly selectedAbsenceId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly error = signal('');
  fileName = '';
  fileUrl = '';
  comment = '';

  ngOnInit() {
    this.api.attendance().subscribe({ next: d => this.data.set(d), error: () => this.error.set('Impossible de charger les présences.'), complete: () => this.loading.set(false) });
    this.reloadJustifications();
  }
  reloadJustifications() {
    this.api.justifications().subscribe({ next: list => this.justifications.set(list), error: () => this.error.set('Impossible de charger les justificatifs.') });
  }
  hasJustification(attendanceId: number) { return this.justifications().some(j => j.attendanceRecordId === attendanceId); }
  selectAbsence(id: number) { this.selectedAbsenceId.set(id); this.fileName=''; this.fileUrl=''; this.comment=''; }
  cancel() { this.selectedAbsenceId.set(null); }
  submitJustification() {
    const attendanceRecordId = this.selectedAbsenceId();
    if (attendanceRecordId == null || !this.fileName.trim() || !this.fileUrl.trim()) return;
    this.sending.set(true);
    this.api.submitJustification({ attendanceRecordId, fileName: this.fileName.trim(), fileUrl: this.fileUrl.trim(), comment: this.comment.trim() }).subscribe({
      next: item => { this.justifications.update(list => [item, ...list]); this.selectedAbsenceId.set(null); this.error.set(''); },
      error: () => this.error.set('Le justificatif n’a pas pu être envoyé. Vérifiez le lien du document.'),
      complete: () => this.sending.set(false)
    });
  }
}
