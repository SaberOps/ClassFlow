import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface AnnouncementSummary {
  id: number;
  title: string;
  body: string;
  targetType: 'ALL' | 'DEPARTMENT' | 'CLASS';
  targetId: number | null;
  authorName: string;
  publishedAt: string;
}

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="panel">
      <h2>Publier une annonce</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Titre
          <input formControlName="title" />
        </label>
        <label>
          Contenu
          <textarea formControlName="body" rows="5"></textarea>
        </label>
        <label>
          Cible
          <select formControlName="targetType">
            <option value="ALL">Tout le campus</option>
            <option value="DEPARTMENT">Une filière</option>
            <option value="CLASS">Une classe</option>
          </select>
        </label>
        <label>
          ID cible
          <input formControlName="targetId" type="number" min="1" placeholder="Optionnel pour tout le campus" />
        </label>
        <button type="submit" [disabled]="saving()">{{ saving() ? 'Publication...' : 'Publier' }}</button>
      </form>
      @if (message()) {
        <p class="message" [class.error]="error()">{{ message() }}</p>
      }
    </section>

    <section class="panel">
      <h2>Annonces récentes</h2>
      @if (items().length === 0) {
        <p>Aucune annonce publiée.</p>
      } @else {
        @for (item of items(); track item.id) {
          <article class="item">
            <small>{{ item.targetType }} · {{ item.authorName }}</small>
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
            <time>{{ item.publishedAt | date: 'dd/MM/yyyy HH:mm' }}</time>
          </article>
        }
      }
    </section>
  `,
  styles: [
    `:host { display:block; max-width:1000px; margin:0 auto; color:#1f2433; }
     .panel { background:#fff; border:1px solid #eaeaf4; border-radius:16px; padding:24px; margin-bottom:24px; box-shadow:0 8px 24px rgba(44,57,89,.04); }
     form { display:grid; gap:16px; }
     label { display:grid; gap:8px; font-weight:600; }
     input, textarea, select { border:1px solid #dfe3f0; border-radius:10px; padding:10px 12px; font:inherit; }
     button { border:0; border-radius:10px; background:#564bb6; color:#fff; padding:12px 18px; font-weight:700; cursor:pointer; }
     .message { margin-top:16px; padding:10px 12px; border-radius:10px; background:#eefaf2; color:#1b5e36; }
     .message.error { background:#fff1f1; color:#90252b; }
     .item { padding:16px 0; border-top:1px solid #ececf5; }
     .item:first-child { border-top:0; }
     small { color:#6a7390; display:block; margin-bottom:6px; }
     h3 { margin:0 0 8px; font-size:1.1rem; }
     p { margin:0 0 8px; white-space:pre-wrap; }
     time { font-size:.82rem; color:#69728e; }
    `
  ]
})
export class AdminAnnouncementsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<AnnouncementSummary[]>([]);
  readonly saving = signal(false);
  readonly message = signal<string>('');
  readonly error = signal(false);

  readonly form = this.fb.group({
    title: ['', [Validators.required]],
    body: ['', [Validators.required]],
    targetType: ['ALL', [Validators.required]],
    targetId: [null]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.http.get<AnnouncementSummary[]>('/api/admin/announcements').subscribe({
      next: (items) => this.items.set(items),
      error: () => this.message.set('Impossible de charger les annonces.')
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      title: value.title?.trim(),
      body: value.body?.trim(),
      targetType: value.targetType ?? 'ALL',
      targetId: value.targetId ?? null
    };

    this.saving.set(true);
    this.http.post<AnnouncementSummary>('/api/admin/announcements', payload).subscribe({
      next: (item) => {
        this.items.update((existing) => [item, ...existing]);
        this.form.reset({ title: '', body: '', targetType: 'ALL', targetId: null });
        this.message.set('Annonce publiée avec succès.');
        this.error.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.message.set('La publication a échoué. Vérifiez les champs et votre rôle.');
        this.error.set(true);
        this.saving.set(false);
      }
    });
  }
}
