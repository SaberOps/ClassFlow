import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentApiService } from '../../../core/services/student-api.service';
import { AssignmentListItem } from '../../../shared/models/student.model';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <header><p class="eyebrow">TRAVAIL PERSONNEL</p><h1>Mes devoirs</h1><p>Suivez vos échéances et l'état de vos dépôts.</p></header>\n    @if (loading()) { <p role="status">Chargement des devoirs…</p> }\n    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }\n    @if (!loading() && items().length===0) { <p class="empty">Aucun devoir à afficher.</p> }
    <table>
      <thead><tr><th>Titre</th><th>Cours</th><th>Échéance</th><th>Statut</th></tr></thead>
      <tbody>
        @for (a of items(); track a.id) {
          <tr>
            <td><a [routerLink]="['/student/assignments', a.id]">{{ a.title }}</a></td>
            <td>{{ a.courseTitle }}</td><td>{{ a.dueAt | date:'short' }}</td><td>{{ a.status }}</td>
          </tr>
        }
      </tbody>
    </table>
  `
})
export class AssignmentsComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly items = signal<AssignmentListItem[]>([]);
  ngOnInit() { this.api.assignments().subscribe(list => this.items.set(list)); }
}
