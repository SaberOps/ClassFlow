import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentApiService } from '../../../core/services/student-api.service';
import { AssignmentListItem, CourseSummary, NotificationItem, Profile } from '../../../shared/models/student.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <h1>Tableau de bord</h1>
    @if (profile(); as p) { <p>{{ p.firstName }} {{ p.lastName }} · {{ p.className }} · {{ p.departmentName }}</p> }
    <p>{{ courses().length }} cours · {{ todo() }} devoirs à faire</p>
    <h2>Prochaines échéances</h2>
    <ul>
      @for (a of upcoming(); track a.id) {
        <li><a [routerLink]="['/student/assignments', a.id]">{{ a.title }}</a> — {{ a.dueAt | date:'short' }} ({{ a.status }})</li>
      }
    </ul>
    <h2>Notifications</h2>
    <ul>@for (n of notes(); track n.id) { <li>{{ n.title }}</li> }</ul>
  `
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly profile = signal<Profile | null>(null);
  readonly courses = signal<CourseSummary[]>([]);
  readonly upcoming = signal<AssignmentListItem[]>([]);
  readonly notes = signal<NotificationItem[]>([]);
  readonly todo = signal(0);
  ngOnInit() {
    this.api.profile().subscribe(p => this.profile.set(p));
    this.api.courses().subscribe(c => this.courses.set(c));
    this.api.assignments().subscribe(list => {
      this.todo.set(list.filter(a => a.status === 'TODO' || a.status === 'LATE').length);
      this.upcoming.set(list.slice(0, 5));
    });
    this.api.notifications().subscribe(n => this.notes.set(n.slice(0, 5)));
  }
}
