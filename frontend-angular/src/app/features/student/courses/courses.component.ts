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
    @if (!loading() && !error() && courses().length===0) { <p class="empty">Aucun cours ne correspond à votre recherche.</p> }
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
  readonly loading = signal(true);
  readonly error = signal('');
  q = '';
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.courses(this.q).subscribe({
      next: list => {
        this.courses.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les cours.');
        this.loading.set(false);
      },
    });
  }
}
