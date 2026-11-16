import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentApiService } from '../../../core/services/student-api.service';
import { AttendanceOverview } from '../../../shared/models/student.model';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h1>Présences</h1>
    @if (data(); as d) {
      <ul>@for (c of d.byCourse; track c.courseId) { <li>{{ c.courseTitle }} — {{ c.presenceRate }}%</li> }</ul>
      <ul>@for (h of d.history; track h.id) { <li>{{ h.sessionStartsAt | date:'short' }} · {{ h.courseTitle }} · {{ h.status }}</li> }</ul>
    }
  `
})
export class AttendanceComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly data = signal<AttendanceOverview | null>(null);
  ngOnInit() { this.api.attendance().subscribe(d => this.data.set(d)); }
}
