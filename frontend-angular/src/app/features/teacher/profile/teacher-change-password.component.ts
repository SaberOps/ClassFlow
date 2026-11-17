import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeacherApiService } from '../../../core/services/teacher-api.service';

@Component({
  selector: 'app-teacher-change-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="wrap">
      <section class="panel">
        <span class="mark" aria-hidden="true">⌑</span>
        <p class="eyebrow">PREMIÈRE CONNEXION</p>
        <h1>Choisissez votre mot de passe</h1>
        <p class="intro">Avant de rejoindre votre espace enseignant, remplacez le mot de passe temporaire par un mot de passe personnel.</p>
        @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
        <form (ngSubmit)="submit()">
          <label>Mot de passe temporaire<input name="currentPassword" type="password" [(ngModel)]="currentPassword" autocomplete="current-password" required /></label>
          <label>Nouveau mot de passe<input name="newPassword" type="password" [(ngModel)]="newPassword" autocomplete="new-password" minlength="10" maxlength="72" required /></label>
          <div class="rules"><strong>Votre mot de passe doit comporter :</strong><span>10 à 72 caractères</span><span>Une majuscule et une minuscule</span><span>Au moins un chiffre</span></div>
          <button type="submit" [disabled]="saving() || !currentPassword || !newPassword">{{ saving() ? 'Mise à jour…' : 'Mettre à jour et continuer' }}</button>
        </form>
      </section>
    </main>
  `,
  styles: [`
    :host{display:grid;min-height:calc(100vh - 60px);place-items:center;color:#292a4d}*{box-sizing:border-box}.wrap{width:min(100%,520px);padding:20px}.panel{padding:30px;border:1px solid #e8e7f2;border-radius:18px;background:#fff;box-shadow:0 12px 35px rgb(48 43 112 / 7%)}.mark{display:grid;width:44px;height:44px;place-items:center;margin-bottom:19px;border-radius:13px;color:#5d568f;background:#efedf9;font-size:1.4rem}.eyebrow{margin:0 0 7px;color:#7771b4;font-size:.67rem;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:1.65rem;letter-spacing:-.04em}.intro{margin:9px 0 19px;color:#77758d;font-size:.83rem;line-height:1.55}.alert{padding:10px;border-radius:9px;color:#9b3836;background:#fff0ef;font-size:.76rem}form{display:grid;gap:13px}label{display:grid;gap:6px;color:#4b4967;font-size:.75rem;font-weight:750}input{width:100%;padding:11px;border:1px solid #dedde9;border-radius:9px;font:inherit;font-size:.82rem}.rules{display:grid;gap:5px;padding:11px;border-radius:10px;color:#77758d;background:#f8f7fc;font-size:.71rem}.rules strong{margin-bottom:2px;color:#4b4967}.rules span:before{content:"•";margin-right:7px;color:#7771b4}form button{padding:12px;border:0;border-radius:9px;color:#fff;background:#393575;font:inherit;font-size:.78rem;font-weight:750;cursor:pointer}.form button:disabled{opacity:.5}.logout{display:block;margin:14px auto 0;border:0;color:#706b8e;background:none;font:inherit;font-size:.72rem;text-decoration:underline;cursor:pointer}.logout:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid #cbc6f0;outline-offset:2px}@media(max-width:430px){.panel{padding:22px}.wrap{padding:13px}}
  `]
})
export class TeacherChangePasswordComponent {
  private readonly api = inject(TeacherApiService);
  private readonly router = inject(Router);
  readonly saving = signal(false);
  readonly error = signal('');
  currentPassword = '';
  newPassword = '';

  submit() {
    if (this.saving()) return;
    this.saving.set(true); this.error.set('');
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => void this.router.navigateByUrl('/teacher/dashboard'),
      error: () => { this.error.set('Mot de passe refusé. Vérifiez le temporaire et les règles de robustesse.'); this.saving.set(false); }
    });
  }
}
