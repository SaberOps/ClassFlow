import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentApiService } from '../../../core/services/student-api.service';
import { NotificationItem } from '../../../shared/models/student.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe],
  template: `
    <header><div><p class="eyebrow">CENTRE D'INFORMATION</p><h1>Notifications</h1><p>Les dernières informations concernant vos cours et votre parcours.</p></div>
      <button type="button" [disabled]="loading() || unread()===0" (click)="readAll()">Tout marquer comme lu</button>
    </header>
    @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
    @if (loading()) { <p role="status">Chargement des notifications…</p> }
    @if (!loading() && items().length===0) { <section class="empty"><span>✓</span><h2>Aucune notification</h2><p>Vous êtes à jour. Les nouvelles informations apparaîtront ici.</p></section> }
    <section class="list">
      @for (n of items(); track n.id) {
        <article [class.unread]="!n.read"><span class="icon">●</span><div class="content"><div class="top"><strong>{{ n.title }}</strong><small>{{ n.createdAt | date:'d MMM yyyy, HH:mm' }}</small></div><p>{{ n.body }}</p>@if (n.link) { <a [href]="n.link">Ouvrir</a> }</div>
          @if (!n.read) { <button class="read" type="button" (click)="read(n)">Marquer lu</button> }
        </article>
      }
    </section>
  `,
  styles: [`
    :host{display:block;max-width:1050px;margin:auto;color:#172033}header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}h1{margin:5px 0;font-size:2rem}header p:not(.eyebrow){color:#718096}.eyebrow{font-size:.72rem;letter-spacing:.12em;color:#63809e;font-weight:800}button{border:0;border-radius:10px;padding:11px 15px;background:#173b60;color:#fff;font-weight:700;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}.list article{display:flex;gap:14px;align-items:flex-start;padding:18px;background:#fff;border:1px solid #e6ebf1;border-radius:14px;margin-bottom:10px}.list article.unread{border-left:4px solid #2879c7;background:#fafdff}.icon{color:#8aa0b8;font-size:.7rem;margin-top:5px}.content{flex:1}.top{display:flex;justify-content:space-between;gap:12px}.top small{color:#8491a0;white-space:nowrap}.content p{color:#5c6878;margin:7px 0}.content a{color:#2463a5;font-weight:700;text-decoration:none}.read{background:#edf4fb;color:#24547f;padding:8px 10px}.empty{text-align:center;background:#fff;border:1px dashed #d7e0e9;border-radius:18px;padding:48px 20px}.empty span{font-size:2rem;color:#26845b}.empty p,.alert{color:#718096}.alert{padding:12px;background:#fff1f0;color:#a3332b;border-radius:10px}@media(max-width:650px){header{align-items:flex-start;flex-direction:column}.list article{flex-wrap:wrap}.top{flex-direction:column;gap:4px}}
  `]
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly items = signal<NotificationItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly unread = signal(0);

  ngOnInit() { this.reload(); }
  reload() {
    this.loading.set(true);
    this.api.notifications().subscribe({
      next: list => { this.items.set(list); this.unread.set(list.filter(n => !n.read).length); },
      error: () => { this.error.set('Les notifications ne sont pas disponibles pour le moment.'); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }
  read(n: NotificationItem) {
    this.api.markRead(n.id).subscribe({ next: () => this.reload(), error: () => this.error.set('Impossible de mettre à jour cette notification.') });
  }
  readAll() {
    this.api.markAllRead().subscribe({ next: () => this.reload(), error: () => this.error.set('Impossible de mettre à jour les notifications.') });
  }
}
