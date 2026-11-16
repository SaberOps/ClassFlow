import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentApiService } from '../../../core/services/student-api.service';
import { CourseSummary } from '../../../shared/models/student.model';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header><p class="eyebrow">PARCOURS PÉDAGOGIQUE</p><h1>Mes cours</h1><p>Accédez aux contenus, documents et devoirs de vos cours.</p></header>
    @if (loading()) { <p role="status">Chargement des cours…</p> }
    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
    <input [(ngModel)]="q" (ngModelChange)="load()" placeholder="Rechercher un cours…" />
    @if (!loading() && courses().length===0) { <p class="empty">Aucun cours ne correspond à votre recherche.</p> }
    <input [(ngModel)]="q" (ngModelChange)="load()" placeholder="Rechercher" />
    <ul>
      @for (c of courses(); track c.id) {
        <li><a [routerLink]="['/student/courses', c.id]">{{ c.code }} — {{ c.title }}</a> · {{ c.teacherName }}</li>
      }
    </ul>
  `
})
export class CoursesComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly courses = signal<CourseSummary[]>([]);
  q = '';
  ngOnInit() { this.load(); }
  load() { this.api.courses(this.q).subscribe(list => this.courses.set(list)); }
}
