import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StudentApiService } from '../../../core/services/student-api.service';
import { CourseDetail } from '../../../shared/models/student.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    @if (loading()) { <p role="status">Chargement du cours…</p> }\n    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }\n    @if (course(); as c) {
      <h1>{{ c.title }}</h1>
      <p>{{ c.teacher.firstName }} {{ c.teacher.lastName }} · {{ c.teacher.email }}</p>
      <p>{{ c.description }}</p>
      <p>{{ c.objectives }}</p>
      <h2>Documents</h2>
      <ul>@for (r of c.resources; track r.id) { <li><a [href]="r.fileUrl" [download]="r.fileName">{{ r.title }}</a></li> }</ul>\n      @if (c.resources.length===0) { <p>Aucun document publié pour ce cours.</p> }
      <h2>Devoirs</h2>
      <ul>@for (a of c.assignments; track a.id) { <li><a [routerLink]="['/student/assignments', a.id]">{{ a.title }}</a> — {{ a.dueAt | date:'short' }}</li> }</ul>\n      @if (c.assignments.length===0) { <p>Aucun devoir publié pour ce cours.</p> }
    }
  `
})
export class CourseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(StudentApiService);
  readonly course = signal<CourseDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit() {
    this.api.course(Number(this.route.snapshot.paramMap.get('id'))).subscribe({
      next: course => {
        this.course.set(course);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger ce cours.');
        this.loading.set(false);
      },
    });
  }
}
