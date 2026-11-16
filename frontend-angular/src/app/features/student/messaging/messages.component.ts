import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentApiService } from '../../../core/services/student-api.service';
import { CourseSummary, StudentMessage } from '../../../shared/models/student.model';

@Component({
  selector: 'app-student-messages',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <header><p class="eyebrow">ÉCHANGES PÉDAGOGIQUES</p><h1>Mini-chat</h1><p>Échangez avec l'enseignant d'un cours auquel vous êtes inscrit.</p></header>
    <section class="chat">
      <label class="course">Cours
        <select [ngModel]="courseId()" (ngModelChange)="selectCourse($event)">
          <option [ngValue]="null">Choisir un cours</option>
          @for (course of courses(); track course.id) { <option [ngValue]="course.id">{{ course.title }} · {{ course.teacherName }}</option> }
        </select>
      </label>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      @if (courseId()) {
        <div class="messages" aria-live="polite">
          @if (loading()) { <p class="muted">Chargement de la conversation…</p> }
          @if (!loading() && messages().length===0) { <p class="muted">Aucun message. Vous pouvez démarrer la conversation.</p> }
          @for (message of messages(); track message.id) {
            <article><strong>{{ message.senderName }}</strong><p>{{ message.body }}</p><small>{{ message.sentAt | date:'d MMM yyyy, HH:mm' }}</small></article>
          }
        </div>
        <form (ngSubmit)="send()">
          <textarea name="message" [(ngModel)]="draft" rows="3" maxlength="4000" required placeholder="Écrire un message à votre enseignant…"></textarea>
          <button type="submit" [disabled]="sending() || !draft.trim()">Envoyer</button>
        </form>
      } @else {
        <div class="empty">Sélectionnez un cours pour afficher votre conversation avec son enseignant.</div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;max-width:900px;margin:auto;color:#172033}header{margin-bottom:22px}h1{font-size:2rem;margin:5px 0}.eyebrow{font-size:.72rem;letter-spacing:.12em;color:#63809e;font-weight:800}header p:last-child,.muted{color:#718096}.chat{background:#fff;border:1px solid #e5ebf2;border-radius:18px;padding:20px}.course{display:grid;gap:7px;font-weight:700}.course select{max-width:500px;padding:11px;border:1px solid #d8e0e9;border-radius:10px;background:white}.messages{min-height:250px;max-height:480px;overflow:auto;margin:18px 0;padding:14px;background:#f6f8fb;border-radius:12px}.messages article{max-width:85%;background:white;border:1px solid #e5ebf2;border-radius:12px;padding:12px 14px;margin:10px 0}.messages article p{margin:7px 0}.messages small{color:#8390a0}.messages strong{font-size:.88rem;color:#24547f}.chat form{display:grid;justify-items:end;gap:10px}.chat textarea{width:100%;box-sizing:border-box;resize:vertical;border:1px solid #d8e0e9;border-radius:12px;padding:12px;font:inherit}.chat button{background:#173b60;color:#fff;border:0;border-radius:10px;padding:11px 18px;font-weight:700}.chat button:disabled{opacity:.45}.empty{text-align:center;color:#718096;padding:40px 10px}.error{color:#a3332b;background:#fff1f0;padding:10px;border-radius:9px}@media(max-width:600px){.chat{padding:14px}.messages article{max-width:100%}}
  `]
})
export class MessagesComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly courses = signal<CourseSummary[]>([]);
  readonly messages = signal<StudentMessage[]>([]);
  readonly courseId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly error = signal('');
  draft = '';

  ngOnInit() {
    this.api.courses().subscribe({
      next: courses => { this.courses.set(courses); if (courses.length) this.selectCourse(courses[0].id); },
      error: () => this.error.set('Impossible de charger vos cours.')
    });
  }
  selectCourse(id: number | null) {
    this.courseId.set(id);
    this.messages.set([]);
    if (id == null) return;
    this.loading.set(true);
    this.api.messages(id).subscribe({
      next: list => this.messages.set(list),
      error: () => this.error.set('Impossible de charger cette conversation.'),
      complete: () => this.loading.set(false)
    });
  }
  send() {
    const courseId = this.courseId();
    const body = this.draft.trim();
    if (courseId == null || !body || this.sending()) return;
    this.sending.set(true);
    this.api.sendMessage({ courseId, body }).subscribe({
      next: message => { this.messages.update(list => [...list, message]); this.draft = ''; this.error.set(''); },
      error: () => this.error.set('Le message n’a pas pu être envoyé.'),
      complete: () => this.sending.set(false)
    });
  }
}
