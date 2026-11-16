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
        <a class="brand" routerLink="/student/dashboard"><span class="brand-mark">C</span><span>ClassFlow<small>ESPACE ÉTUDIANT</small></span></a>
        <p class="nav-label">MENU PRINCIPAL</p>
        <nav aria-label="Navigation étudiant">
          <a routerLink="/student/dashboard" routerLinkActive="on"><span>⌂</span>Tableau de bord</a>
          <a routerLink="/student/courses" routerLinkActive="on"><span>▤</span>Cours</a>
          <a routerLink="/student/assignments" routerLinkActive="on"><span>✓</span>Devoirs</a>
          <a routerLink="/student/grades" routerLinkActive="on"><span>▥</span>Notes</a>
          <a routerLink="/student/timetable" routerLinkActive="on"><span>▦</span>Emploi du temps</a>
          <a routerLink="/student/attendance" routerLinkActive="on"><span>◷</span>Présences</a>
          <a routerLink="/student/request-documents" routerLinkActive="on"><span>▧</span>Documents</a>
          <a routerLink="/student/notifications" routerLinkActive="on"><span>♢</span>Notifications <b>{{ unread() }}</b></a>
          <a routerLink="/student/teachers" routerLinkActive="on"><span>♧</span>Enseignants</a>
          <a routerLink="/student/messages" routerLinkActive="on"><span>✉</span>Mini-chat</a>
          <a routerLink="/student/feed" routerLinkActive="on"><span>◷</span>Fil d’actualités</a>
        </nav>
        <div class="bottom"><a routerLink="/student/profile" routerLinkActive="on">⚙ Mon profil</a><button type="button" (click)="logout()">↪ Déconnexion</button></div>
      </aside>
      <main><div class="mobile-brand">ClassFlow <span>· Espace étudiant</span></div><router-outlet /></main>
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh}.layout{display:flex;min-height:100vh;background:#f5f7fb;color:#172033}aside{width:258px;flex:none;background:#10243e;color:#dce7f3;padding:24px 16px;display:flex;flex-direction:column}.brand{display:flex;align-items:center;gap:11px;color:#fff;text-decoration:none;font-size:1.25rem;font-weight:800;padding:4px 8px 30px}.brand small{display:block;font-size:.62rem;letter-spacing:.13em;color:#93abc4;margin-top:3px}.brand-mark{width:38px;height:38px;display:grid;place-items:center;background:#397db7;border-radius:12px;color:#fff}.nav-label{font-size:.66rem;letter-spacing:.14em;color:#829ab3;font-weight:800;padding:0 10px;margin-bottom:10px}nav{display:grid;gap:5px}nav a,.bottom>a,.bottom button{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;color:#bdcddd;text-decoration:none;font-size:.91rem}nav a span{width:18px;text-align:center;color:#8eabc8}nav a.on,.bottom>a.on{background:#234361;color:#fff}nav a b{margin-left:auto;background:#3678b2;color:white;border-radius:20px;padding:2px 7px;font-size:.72rem}.bottom{margin-top:auto;padding-top:22px;border-top:1px solid #29425b;display:grid;gap:5px}.bottom button{border:0;background:transparent;text-align:left;cursor:pointer;font:inherit}main{flex:1;min-width:0;padding:30px 34px}.mobile-brand{display:none}@media(max-width:760px){.layout{display:block}aside{width:auto;padding:12px 14px}.brand{padding:0 4px 12px}.nav-label,.bottom{display:none}nav{display:flex;overflow-x:auto;gap:5px;padding-bottom:3px}nav a{white-space:nowrap;padding:9px 10px;font-size:.82rem}nav a span{display:none}main{padding:18px 14px}.mobile-brand{display:block;font-weight:800;color:#173b60;margin-bottom:18px}.mobile-brand span{font-weight:500;color:#718096}} 
  `]
})
export class StudentLayoutComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly unread = signal(0);
  ngOnInit() { this.refreshUnread(); }
  refreshUnread() {
    this.api.unreadCount().subscribe({ next: c => this.unread.set(c.unread), error: () => this.unread.set(0) });
  }
  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
