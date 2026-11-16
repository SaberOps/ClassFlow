import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentApiService } from '../../../core/services/student-api.service';
import { StudentFeedItem } from '../../../shared/models/student.model';

@Component({
  selector: 'app-student-feed',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <header><p class="eyebrow">VOTRE ESPACE</p><h1>Fil d'actualités</h1><p>Les annonces, séances et échéances de vos cours réunies au même endroit.</p></header>
    @if (loading()) { <p role="status">Chargement du fil…</p> }
    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
    @if (!loading() && items().length===0) { <section class="empty"><h2>Rien de nouveau pour le moment</h2><p>Les prochaines actualités de vos cours apparaîtront ici.</p></section> }
    <section class="feed">
      @for (item of items(); track item.type + '-' + item.id) {
        <article>
          <div class="type" [class.session]="item.type==='SESSION'" [class.assignment]="item.type==='ASSIGNMENT'">
            {{ item.type==='ANNOUNCEMENT' ? 'ANNONCE' : item.type==='SESSION' ? 'SÉANCE' : 'ÉCHÉANCE' }}
          </div>
          <div class="body"><small>{{ item.courseTitle || 'ClassFlow' }}</small><h2>{{ item.title }}</h2>
            @if (item.description) { <p>{{ item.description }}</p> }
            <footer><time>{{ item.date | date:'EEEE d MMMM, HH:mm' }}</time><a [routerLink]="item.link">Consulter →</a></footer>
          </div>
        </article>
      }
    </section>
  `,
  styles: [`
    :host{display:block;max-width:1000px;margin:auto;color:#172033}header{margin-bottom:24px}h1{font-size:2rem;margin:5px 0}.eyebrow{font-size:.72rem;letter-spacing:.12em;color:#63809e;font-weight:800}header p:last-child{color:#718096}.feed{display:grid;gap:12px}.feed article{display:flex;gap:18px;background:white;border:1px solid #e5ebf2;border-radius:16px;padding:20px}.type{flex:none;align-self:flex-start;background:#edf5ff;color:#285e91;padding:7px 9px;border-radius:8px;font-size:.65rem;font-weight:800;letter-spacing:.05em}.type.session{background:#edf8f2;color:#26734a}.type.assignment{background:#fff5e8;color:#93601e}.body{min-width:0;flex:1}.body small{color:#718096}.body h2{font-size:1.08rem;margin:5px 0}.body p{color:#5e6b7a;margin:6px 0 12px}.body footer{display:flex;justify-content:space-between;gap:12px;align-items:center;color:#8190a1;font-size:.83rem}.body a{color:#2463a5;text-decoration:none;font-weight:700}.empty{background:#fff;padding:40px;border-radius:16px;text-align:center;color:#718096}.error{padding:12px;background:#fff1f0;color:#a3332b;border-radius:10px}@media(max-width:560px){.feed article{gap:10px;padding:15px;flex-direction:column}.body footer{align-items:flex-start;flex-direction:column}}
  `]
})
export class FeedComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly items = signal<StudentFeedItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  ngOnInit() {
    this.api.feed().subscribe({
      next: items => this.items.set(items),
      error: () => { this.error.set('Le fil d’actualités est momentanément indisponible.'); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }
}
