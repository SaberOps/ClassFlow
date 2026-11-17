import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StudentApiService } from '../../../core/services/student-api.service';
import { AssignmentDetail } from '../../../shared/models/student.model';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    @if (item(); as a) {
      <h1>{{ a.title }}</h1>
      <p>{{ a.courseTitle }} · {{ a.dueAt | date:'short' }}</p>
      <p>{{ a.instructions }}</p>
      <ul>@for (f of a.attachments; track f.id) { <li><a [href]="f.fileUrl" [download]="f.fileName">{{ f.fileName }}</a></li> }</ul>
      @if (a.submission) {
        <p>Déposé le {{ a.submission.submittedAt | date:'short' }} — {{ a.submission.status }}</p>
        @if (a.submission.score != null) { <p>Note : {{ a.submission.score }} — {{ a.submission.teacherFeedback }}</p> }
      }
      <form (ngSubmit)="send()">
        <input name="fileName" [(ngModel)]="fileName" placeholder="Nom du fichier" required />
        <input name="fileUrl" [(ngModel)]="fileUrl" placeholder="URL du fichier" required />
        <textarea name="comment" [(ngModel)]="comment"></textarea>
        <button type="submit">Déposer</button>
      </form>
      @if (error()) { <p>{{ error() }}</p> }
    }
  `
})
export class AssignmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(StudentApiService);
  readonly item = signal<AssignmentDetail | null>(null);
  readonly error = signal('');
  fileName = ''; fileUrl = ''; comment = '';
  private id = 0;
  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.assignment(this.id).subscribe(a => this.item.set(a));
  }
  send() {
    this.api.submit(this.id, { fileName: this.fileName, fileUrl: this.fileUrl, comment: this.comment }).subscribe({
      next: () => this.api.assignment(this.id).subscribe(a => { this.item.set(a); this.error.set('Dépôt enregistré'); }),
      error: () => this.error.set('Dépôt refusé')
    });
  }
}
