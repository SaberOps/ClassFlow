import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentApiService } from '../../../core/services/student-api.service';
import { TeacherContact } from '../../../shared/models/student.model';

@Component({
  selector: 'app-teachers',
  standalone: true,
  template: `
    <h1>Mes enseignants</h1>
    <ul>
      @for (t of teachers(); track t.id) {
        <li><strong>{{ t.firstName }} {{ t.lastName }}</strong><div>{{ t.email }}</div><div>{{ t.courses.join(', ') }}</div></li>
      }
    </ul>
  `
})
export class TeachersComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly teachers = signal<TeacherContact[]>([]);
  ngOnInit() { this.api.teachers().subscribe(list => this.teachers.set(list)); }
}
