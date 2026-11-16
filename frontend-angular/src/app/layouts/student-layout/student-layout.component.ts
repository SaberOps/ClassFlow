import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { StudentApiService } from '../../core/services/student-api.service';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside>
        <h1>ClassFlow</h1>
        <nav>
          <a routerLink="/student/dashboard" routerLinkActive="on">Tableau de bord</a>
          <a routerLink="/student/courses" routerLinkActive="on">Cours</a>
          <a routerLink="/student/assignments" routerLinkActive="on">Devoirs</a>
          <a routerLink="/student/grades" routerLinkActive="on">Notes</a>
          <a routerLink="/student/timetable" routerLinkActive="on">Emploi du temps</a>
          <a routerLink="/student/attendance" routerLinkActive="on">Présences</a>
          <a routerLink="/student/request-documents" routerLinkActive="on">Demandes</a>
          <a routerLink="/student/notifications" routerLinkActive="on">Notifications ({{ unread() }})</a>
          <a routerLink="/student/teachers" routerLinkActive="on">Enseignants</a>
          <a routerLink="/student/profile" routerLinkActive="on">Profil</a>
        </nav>
        <button type="button" (click)="logout()">Déconnexion</button>
      </aside>
      <main><router-outlet /></main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    aside { width:240px; background:#0f172a; color:#e2e8f0; padding:1rem; display:flex; flex-direction:column; }
    nav a { display:block; color:#cbd5e1; text-decoration:none; padding:.4rem 0; }
    nav a.on { color:#38bdf8; }
    main { flex:1; padding:1.25rem; background:#f8fafc; }
    @media (max-width: 720px) { .layout { flex-direction:column; } aside { width:100%; } }
  `]
})
export class StudentLayoutComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly unread = signal(0);
  ngOnInit() { this.api.unreadCount().subscribe({ next: c => this.unread.set(c.unread), error: () => {} }); }
  logout() { this.auth.logout().subscribe(() => this.router.navigateByUrl('/login')); }
}
