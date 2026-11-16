import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentApiService } from '../../../core/services/student-api.service';
import { NotificationItem } from '../../../shared/models/student.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h1>Notifications</h1>
    <button type="button" (click)="readAll()">Tout marquer comme lu</button>
    <ul>
      @for (n of items(); track n.id) {
        <li>
          <strong>{{ n.title }}</strong>
          <p>{{ n.body }}</p>
          <small>{{ n.createdAt | date:'short' }}</small>
          @if (!n.read) { <button type="button" (click)="read(n)">Marquer lu</button> }
        </li>
      }
    </ul>
  `
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly items = signal<NotificationItem[]>([]);
  ngOnInit() { this.reload(); }
  reload() { this.api.notifications().subscribe(list => this.items.set(list)); }
  read(n: NotificationItem) { this.api.markRead(n.id).subscribe(() => this.reload()); }
  readAll() { this.api.markAllRead().subscribe(() => this.reload()); }
}
