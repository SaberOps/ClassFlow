import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentApiService } from '../../../core/services/student-api.service';
import { GradeItem } from '../../../shared/models/student.model';

@Component({
  selector: 'app-grades',
  standalone: true,
  template: `
    <h1>Mes notes</h1>
    <table>
      <thead><tr><th>Matière</th><th>Devoir</th><th>Note</th><th>Commentaire</th></tr></thead>
      <tbody>
        @for (g of grades(); track g.assignmentId) {
          <tr><td>{{ g.courseTitle }}</td><td>{{ g.title }}</td><td>{{ g.score }}</td><td>{{ g.teacherFeedback }}</td></tr>
        }
      </tbody>
    </table>
  `
})
export class GradesComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly grades = signal<GradeItem[]>([]);
  ngOnInit() { this.api.grades().subscribe(list => this.grades.set(list)); }
}
