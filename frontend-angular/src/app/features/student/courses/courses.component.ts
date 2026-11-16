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
    <h1>Mes cours</h1>
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
