import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentApiService } from '../../../core/services/student-api.service';
import { RequestDocument } from '../../../shared/models/student.model';

@Component({
  selector: 'app-request-documents',
  standalone: true,
  template: `
    <h1>Documents de demandes</h1>
    <ul>
      @for (d of docs(); track d.id) {
        <li><strong>{{ d.title }}</strong><p>{{ d.description }}</p><a [href]="d.fileUrl" [download]="d.fileName">{{ d.fileName }}</a></li>
      }
    </ul>
  `
})
export class RequestDocumentsComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly docs = signal<RequestDocument[]>([]);
  ngOnInit() { this.api.requestDocuments().subscribe(list => this.docs.set(list)); }
}
