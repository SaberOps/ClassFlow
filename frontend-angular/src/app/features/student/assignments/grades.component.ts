import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentApiService } from '../../../core/services/student-api.service';
import { GradeItem } from '../../../shared/models/student.model';

@Component({
  selector: 'app-grades',
  standalone: true,
  template: `
    <header><p class="eyebrow">RÉSULTATS</p><h1>Mes notes</h1><p>Vos résultats et les commentaires transmis par vos enseignants.</p></header>\n    @if (loading()) { <p role="status">Chargement des notes…</p> }\n    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }\n    @if (!loading() && grades().length===0) { <p class="empty">Aucune note publiée pour le moment.</p> }
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
