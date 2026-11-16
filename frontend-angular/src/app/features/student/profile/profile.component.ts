import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentApiService } from '../../../core/services/student-api.service';
import { Profile } from '../../../shared/models/student.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (profile(); as p) {
      <h1>Mon profil</h1>
      <p>{{ p.firstName }} {{ p.lastName }} — {{ p.email }}</p>
      <p>Filière : {{ p.departmentName || '—' }} · Classe : {{ p.className || '—' }}</p>
      <form (ngSubmit)="save()">
        <label>Téléphone <input name="phone" [(ngModel)]="phone" /></label>
        <label>Photo URL <input name="photo" [(ngModel)]="photoUrl" /></label>
        <button type="submit">Enregistrer</button>
      </form>
      <h2>Mot de passe</h2>
      <form (ngSubmit)="changePassword()">
        <input type="password" name="cur" [(ngModel)]="currentPassword" placeholder="Actuel" />
        <input type="password" name="nw" [(ngModel)]="newPassword" placeholder="Nouveau" />
        <button type="submit">Changer</button>
      </form>
      @if (message()) { <p>{{ message() }}</p> }
    }
  `
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  readonly profile = signal<Profile | null>(null);
  readonly message = signal('');
  phone = ''; photoUrl = ''; currentPassword = ''; newPassword = '';
  ngOnInit() {
    this.api.profile().subscribe(p => { this.profile.set(p); this.phone = p.phone ?? ''; this.photoUrl = p.photoUrl ?? ''; });
  }
  save() {
    this.api.updateProfile({ phone: this.phone, photoUrl: this.photoUrl }).subscribe(p => {
      this.profile.set(p); this.message.set('Profil mis à jour');
    });
  }
  changePassword() {
    this.api.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => this.message.set('Mot de passe modifié'),
      error: () => this.message.set('Mot de passe refusé')
    });
  }
}
