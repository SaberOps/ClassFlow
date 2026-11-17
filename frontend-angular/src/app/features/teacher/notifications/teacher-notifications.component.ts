import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TeacherApiService, TeacherNotification } from '../../../core/services/teacher-api.service';

@Component({
  selector: 'app-teacher-notifications',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page">
      <header><div><p class="eyebrow">RESTEZ INFORMÉ</p><h1>Notifications</h1><p>Les informations liées à vos cours et à votre activité.</p></div><button type="button" class="primary" [disabled]="!unread() || saving()" (click)="markAllRead()">Tout marquer comme lu</button></header>
      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (loading()) { <p class="loading" role="status">Chargement des notifications…</p> }
      @else if (!notifications().length) {
        <section class="empty"><span aria-hidden="true">◇</span><h2>Vous êtes à jour</h2><p>Les événements importants apparaîtront ici.</p></section>
      } @else {
        <section class="list" aria-label="Centre de notifications">
          <div class="summary"><strong>{{ unread() }}</strong><span>non lue{{ unread() === 1 ? '' : 's' }}</span><small>Triées de la plus récente à la plus ancienne</small></div>
          @for (notification of notifications(); track notification.id) {
            <article [class.unread]="!notification.read">
              <span class="dot" [class.fresh]="!notification.read" aria-hidden="true"></span>
              <div class="message"><div class="message-heading"><h2>{{ notification.title }}</h2><time>{{ notification.createdAt | date:'d MMM y · HH:mm' }}</time></div><p>{{ notification.body || 'Consultez cette notification pour en savoir plus.' }}</p>
                @if (notification.link) { <a [routerLink]="notification.link">Consulter ↗</a> }
                @if (!notification.read) { <button type="button" class="read" [disabled]="saving()" (click)="markRead(notification)">Marquer comme lu</button> }
              </div>
            </article>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1050px;margin:auto;color:#292a4d}*{box-sizing:border-box}.page{display:grid;gap:15px}header{display:flex;align-items:flex-end;justify-content:space-between;gap:15px}.eyebrow{margin:0 0 7px;color:#7771b4;font-size:.67rem;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:2rem;letter-spacing:-.05em}header p:last-child{margin:7px 0 0;color:#77758d;font-size:.87rem}.primary,.read{padding:10px 12px;border:0;border-radius:9px;color:#fff;background:#393575;font:inherit;font-size:.73rem;font-weight:750;cursor:pointer}.primary:disabled,.read:disabled{opacity:.5;cursor:not-allowed}.list{overflow:hidden;border:1px solid #e8e7f2;border-radius:16px;background:white;box-shadow:0 4px 14px rgb(48 43 112 / 3%)}.summary{display:flex;align-items:baseline;gap:7px;padding:14px 18px;border-bottom:1px solid #efedf5;color:#77758d;font-size:.75rem}.summary strong{color:#4d477e;font-size:1.2rem}.summary small{margin-left:auto;color:#9a97a8;font-size:.68rem}.list article{display:flex;gap:13px;padding:17px 18px;border-bottom:1px solid #f0eff5}.list article:last-child{border-bottom:0}.list article.unread{background:#fcfbff;box-shadow:inset 3px 0 #796fc5}.dot{width:8px;height:8px;flex:0 0 auto;margin-top:6px;border-radius:50%;background:#d7d4e5}.dot.fresh{background:#776cc2;box-shadow:0 0 0 4px #f0eefb}.message{min-width:0;flex:1}.message-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.message h2{margin:0;font-size:.89rem}.message time{color:#918ea0;font-size:.68rem;white-space:nowrap}.message p{margin:7px 0;color:#77758a;font-size:.78rem;line-height:1.45}.message a{color:#5d568f;font-size:.74rem;font-weight:750;text-decoration:none}.read{margin-top:7px;padding:7px 9px;color:#615b98;background:#f0eff9;font-size:.67rem}.empty{padding:50px 20px;border:1px dashed #dedced;border-radius:16px;color:#77758d;background:#fff;text-align:center}.empty>span{color:#8981d0;font-size:2rem}.empty h2{margin:8px 0;color:#454361;font-size:1rem}.empty p{margin:0;font-size:.8rem}.loading{margin:0;color:#77758d;font-size:.8rem}.alert{margin:0;padding:11px;border-radius:10px;color:#9b3836;background:#fff0ef;font-size:.82rem}@media(max-width:600px){header{align-items:flex-start;flex-direction:column}.primary{width:100%}.list article{padding:14px}.message-heading{flex-direction:column;gap:4px}.summary{flex-wrap:wrap}.summary small{width:100%;margin-left:0}}
  `]
})
export class TeacherNotificationsComponent implements OnInit {
  private readonly api = inject(TeacherApiService);
  readonly notifications = signal<TeacherNotification[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly unread = signal(0);
  readonly error = signal('');

  ngOnInit() { this.load(); }
  private load() {
    this.loading.set(true); this.error.set('');
    this.api.notifications().subscribe({
      next: values => { this.notifications.set(values); this.unread.set(values.filter(n => !n.read).length); },
      error: () => { this.error.set('Impossible de charger les notifications.'); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }
  markRead(notification: TeacherNotification) {
    this.saving.set(true);
    this.api.markRead(notification.id).subscribe({
      next: () => this.load(),
      error: () => { this.error.set('Impossible de mettre à jour cette notification.'); this.saving.set(false); },
      complete: () => this.saving.set(false)
    });
  }
  markAllRead() {
    this.saving.set(true);
    this.api.markAllRead().subscribe({
      next: () => this.load(),
      error: () => { this.error.set('Impossible de mettre à jour les notifications.'); this.saving.set(false); },
      complete: () => this.saving.set(false)
    });
  }
}
