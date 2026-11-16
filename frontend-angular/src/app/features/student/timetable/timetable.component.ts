import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentApiService } from '../../../core/services/student-api.service';
import { SessionItem } from '../../../shared/models/student.model';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [DatePipe],
  template: `
    <header><p class="eyebrow">ORGANISATION</p><h1>Emploi du temps</h1><p>Consultez vos séances par semaine.</p></header>\n    @if (loading()) { <p role="status">Chargement de la semaine…</p> }\n    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }\n    @if (!loading() && sessions().length===0) { <p class="empty">Aucune séance prévue pour cette semaine.</p> }
    <button type="button" (click)="shift(-7)">Semaine précédente</button>
    <button type="button" (click)="shift(7)">Semaine suivante</button>
    <ul>
      @for (s of sessions(); track s.id) {
        <li>{{ s.startsAt | date:'EEE d MMM HH:mm' }}–{{ s.endsAt | date:'HH:mm' }} · {{ s.courseTitle }} · {{ s.teacherName }} · {{ s.room }}</li>
      }
    </ul>
  `
})
export class TimetableComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly sessions = signal<SessionItem[]>([]);
  private monday = TimetableComponent.monday(new Date());
  ngOnInit() { this.load(); }
  shift(days: number) { this.monday = new Date(this.monday.getTime() + days * 86400000); this.load(); }
  load() { this.api.timetableWeek(this.monday.toISOString().slice(0, 10)).subscribe(r => this.sessions.set(r.sessions)); }
  static monday(d: Date) {
    const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = x.getUTCDay() || 7;
    x.setUTCDate(x.getUTCDate() - day + 1);
    return x;
  }
}
