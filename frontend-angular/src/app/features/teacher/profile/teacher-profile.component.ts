import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeacherApiService, TeacherProfile } from '../../../core/services/teacher-api.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <header><p class="eyebrow">VOTRE ESPACE PERSONNEL</p><h1>Mon profil</h1><p>Vérifiez votre identité et mettez à jour vos coordonnées.</p></header>
      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
      @if (loading()) { <p class="loading" role="status">Chargement de votre profil…</p> }
      @else {
       @if (profile(); as user) {
        <div class="columns">
          <section class="panel identity">
            <div class="avatar" aria-hidden="true">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</div>
            <p class="eyebrow">INFORMATIONS D’IDENTITÉ</p>
            <h2>{{ user.firstName }} {{ user.lastName }}</h2>
            <p class="email">{{ user.email }}</p>
            <div class="subjects"><span class="label">Matières</span>@if (!user.subjects.length) { <small>Aucune matière renseignée</small> } @for (subject of user.subjects; track subject) { <span class="chip">{{ subject }}</span> }</div>
            <small class="readonly">Nom, adresse e-mail et matières sont gérés par l’administration.</small>
          </section>
          <section class="panel">
            <p class="eyebrow">COORDONNÉES</p><h2>Informations de contact</h2>
            <form (ngSubmit)="saveProfile()">
              <label>Téléphone<input name="phone" type="tel" [(ngModel)]="phone" maxlength="30" placeholder="+216 …" pattern="^\+?[0-9 ()-]{7,20}$" /></label>
              <label>Photo de profil — lien<input name="photoUrl" type="url" [(ngModel)]="photoUrl" maxlength="500" placeholder="https://…" /></label>
              @if (photoUrl) { <img class="preview" [src]="photoUrl" alt="Aperçu de la photo de profil" /> }
              <small class="hint">Les photos doivent déjà être hébergées à une adresse sécurisée. Aucun téléversement n’est configuré.</small>
              <button class="primary" type="submit" [disabled]="saving()">Enregistrer les coordonnées</button>
            </form>
          </section>
          <section class="panel password">
            <p class="eyebrow">SÉCURITÉ</p><h2>Changer le mot de passe</h2>
            <form (ngSubmit)="changePassword()">
              <label>Mot de passe actuel<input name="currentPassword" type="password" [(ngModel)]="currentPassword" autocomplete="current-password" required /></label>
              <label>Nouveau mot de passe<input name="newPassword" type="password" [(ngModel)]="newPassword" autocomplete="new-password" minlength="10" maxlength="72" required /></label>
              <small class="hint">10 à 72 caractères, avec une majuscule, une minuscule et un chiffre.</small>
              <button class="secondary" type="submit" [disabled]="saving()">Mettre à jour le mot de passe</button>
            </form>
          </section>
        </div>
       }
      }
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1050px;margin:auto;color:#292a4d}*{box-sizing:border-box}.page{display:grid;gap:16px}header{margin-bottom:1px}.eyebrow{margin:0 0 7px;color:#7771b4;font-size:.67rem;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:2rem;letter-spacing:-.05em}header p:last-child{margin:7px 0 0;color:#77758d;font-size:.87rem}.columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.panel{min-width:0;padding:19px;border:1px solid #e8e7f2;border-radius:16px;background:#fff;box-shadow:0 4px 14px rgb(48 43 112 / 3%)}.panel h2{margin:0 0 15px;font-size:1.05rem}.identity{position:relative;grid-row:span 2;display:flex;align-items:flex-start;flex-direction:column}.avatar{display:grid;width:58px;height:58px;place-items:center;margin-bottom:19px;border-radius:17px;color:#5d568f;background:#efedf9;font-size:1rem;font-weight:850}.identity h2{margin:0;font-size:1.25rem}.email{margin:5px 0 18px;color:#77758d;font-size:.82rem}.subjects{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.label{margin-right:4px;color:#77758d;font-size:.74rem;font-weight:750}.chip{padding:6px 9px;border-radius:20px;color:#5e578f;background:#f1f0fa;font-size:.7rem;font-weight:750}.subjects small{color:#918ea0;font-size:.73rem}.readonly{margin-top:auto;padding-top:24px;color:#9a97a6;font-size:.69rem}.panel form{display:grid;gap:12px}.panel label{display:grid;gap:6px;color:#4b4967;font-size:.75rem;font-weight:750}.panel input{width:100%;padding:10px;border:1px solid #dedde9;border-radius:9px;color:#33324f;background:white;font:inherit;font-size:.8rem}.panel input:focus-visible{outline:3px solid #cbc6f0;outline-offset:1px}.preview{width:68px;height:68px;object-fit:cover;border-radius:14px;border:1px solid #e5e3ef}.hint{color:#89869a;font-size:.69rem;line-height:1.4}.primary,.secondary{padding:10px 12px;border:0;border-radius:9px;font:inherit;font-size:.74rem;font-weight:750;cursor:pointer}.primary{color:white;background:#393575}.secondary{color:#514e76;background:#f0eff8}.primary:disabled,.secondary:disabled{opacity:.5}.loading{margin:0;color:#77758d;font-size:.8rem}.alert,.notice{margin:0;padding:11px;border-radius:10px;font-size:.82rem}.alert{color:#9b3836;background:#fff0ef}.notice{color:#276b49;background:#edf8f1}@media(max-width:700px){.columns{grid-template-columns:1fr}.identity{grid-row:auto}.readonly{margin-top:20px;padding-top:0}}@media(max-width:380px){.panel{padding:15px}}
  `]
})
export class TeacherProfileComponent implements OnInit {
  private readonly api = inject(TeacherApiService);
  readonly profile = signal<TeacherProfile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  phone = '';
  photoUrl = '';
  currentPassword = '';
  newPassword = '';

  ngOnInit() {
    this.api.profile().subscribe({
      next: value => { this.profile.set(value); this.phone = value.phone ?? ''; this.photoUrl = value.photoUrl ?? ''; },
      error: () => { this.error.set('Impossible de charger votre profil.'); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }
  saveProfile() {
    this.saving.set(true); this.error.set(''); this.notice.set('');
    this.api.updateProfile({ phone: this.phone, photoUrl: this.photoUrl }).subscribe({
      next: value => { this.profile.set(value); this.notice.set('Coordonnées mises à jour.'); },
      error: () => this.error.set('Mise à jour refusée. Vérifiez le format du téléphone et du lien de photo.'),
      complete: () => this.saving.set(false)
    });
  }
  changePassword() {
    this.saving.set(true); this.error.set(''); this.notice.set('');
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => { this.currentPassword = ''; this.newPassword = ''; this.notice.set('Mot de passe modifié avec succès.'); },
      error: () => this.error.set('Mot de passe non modifié. Vérifiez votre mot de passe actuel et les règles de robustesse.'),
      complete: () => this.saving.set(false)
    });
  }
}
