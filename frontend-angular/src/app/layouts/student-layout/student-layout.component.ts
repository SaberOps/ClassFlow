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
      <aside aria-label="Espace étudiant">
        <a class="brand" routerLink="/student/dashboard">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span>ClassFlow<small>ESPACE ÉTUDIANT</small></span>
        </a>
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
        <div class="bottom">
          <a routerLink="/student/profile" routerLinkActive="on">⚙ Mon profil</a>
          <button type="button" (click)="logout()">↪ Déconnexion</button>
        </div>
      </aside>
      <main>
        <div class="mobile-brand">
          <span class="mobile-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span>ClassFlow<small>ESPACE ÉTUDIANT</small></span>
        </div>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #292a4d; font-family: Inter, "Segoe UI", Arial, sans-serif; }
    * { box-sizing: border-box; }

    .layout {
      display: flex;
      min-height: 100vh;
      background:
        radial-gradient(ellipse at 94% 0%, rgb(210 205 255 / 27%), transparent 34%),
        radial-gradient(ellipse at 4% 92%, rgb(115 104 213 / 8%), transparent 38%),
        #f7f7fc;
    }

    aside {
      position: sticky;
      top: 0;
      display: flex;
      width: 258px;
      height: 100vh;
      flex: 0 0 auto;
      flex-direction: column;
      overflow-y: auto;
      padding: 23px 15px 16px;
      color: #e6e4fa;
      background:
        radial-gradient(ellipse at 82% 18%, rgb(170 155 255 / 20%), transparent 34%),
        linear-gradient(155deg, #393575 0%, #2d2b63 58%, #252447 100%);
      box-shadow: 8px 0 34px rgb(47 43 112 / 10%);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 4px 8px 27px;
      color: #fff;
      font-size: 17px;
      font-weight: 750;
      letter-spacing: -.5px;
      text-decoration: none;
    }

    .brand small, .mobile-brand small {
      display: block;
      margin-top: 3px;
      color: #c0bddf;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 1.4px;
    }

    .brand-mark, .mobile-mark {
      display: grid;
      width: 34px;
      height: 34px;
      flex: 0 0 auto;
      grid-template-columns: repeat(2, 1fr);
      gap: 3px;
      padding: 5px;
      border: 1px solid rgb(255 255 255 / 32%);
      border-radius: 10px;
      background: rgb(255 255 255 / 7%);
      box-shadow: 0 6px 18px rgb(8 7 38 / 14%);
      transform: rotate(-6deg);
    }

    .brand-mark span, .mobile-mark span { border-radius: 3px; background: #c4bfff; }
    .nav-label { margin: 0 10px 10px; color: #bcb8ea; font-size: 9px; font-weight: 800; letter-spacing: 1.4px; }
    nav { display: grid; gap: 4px; }

    nav a, .bottom > a, .bottom button {
      display: flex;
      min-height: 39px;
      align-items: center;
      gap: 11px;
      padding: 9px 11px;
      border: 1px solid transparent;
      border-radius: 10px;
      color: #d3d2ee;
      font-size: 11px;
      font-weight: 550;
      text-decoration: none;
      transition: transform 170ms ease, color 170ms ease, background 170ms ease, border-color 170ms ease;
    }

    nav a:hover, .bottom > a:hover, .bottom button:hover {
      transform: translateX(2px);
      color: #fff;
      background: rgb(255 255 255 / 8%);
    }

    nav a.on, .bottom > a.on {
      border-color: rgb(203 198 255 / 18%);
      color: #fff;
      background: linear-gradient(100deg, rgb(203 198 255 / 19%), rgb(203 198 255 / 8%));
      box-shadow: inset 3px 0 #b2aaff, inset 0 1px rgb(255 255 255 / 6%);
    }

    nav a:focus-visible, .bottom a:focus-visible, .bottom button:focus-visible {
      outline: 3px solid #b2aaff;
      outline-offset: 2px;
    }

    nav a span { width: 18px; flex: 0 0 auto; color: #c4bfff; font-size: 14px; text-align: center; }
    nav a b { margin-left: auto; padding: 2px 7px; border: 1px solid rgb(255 255 255 / 12%); border-radius: 20px; color: #fff; background: rgb(255 255 255 / 11%); font-size: 9px; }
    .bottom { display: grid; gap: 4px; margin-top: auto; padding-top: 14px; border-top: 1px solid rgb(230 228 250 / 14%); }
    .bottom button { width: 100%; border: 0; background: transparent; cursor: pointer; font: inherit; text-align: left; }
    main { min-width: 0; flex: 1; padding: 30px 34px; }
    .mobile-brand { display: none; }

    @media (max-width: 760px) {
      .layout { display: block; }
      aside { position: static; width: auto; height: auto; overflow: visible; padding: 12px 14px 10px; }
      .brand { padding: 0 4px 11px; }
      .nav-label, .bottom { display: none; }
      nav { display: flex; gap: 5px; overflow-x: auto; padding: 0 0 3px; scrollbar-width: thin; }
      nav a { min-height: 34px; flex: 0 0 auto; padding: 8px 10px; font-size: 10px; }
      nav a span { display: none; }
      nav a.on { box-shadow: inset 0 -2px #b2aaff; }
      main { padding: 17px 14px; }
      .mobile-brand { display: flex; align-items: center; gap: 9px; margin: 0 0 15px 3px; color: #393575; font-size: 13px; font-weight: 800; }
      .mobile-brand small { color: #7168bd; font-size: 7px; }
      .mobile-mark { width: 28px; height: 28px; padding: 4px; border-color: #e4e1fa; background: #fff; box-shadow: 0 4px 12px rgb(47 43 112 / 8%); }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; }
    }
  `]
})
export class StudentLayoutComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly unread = signal(0);

  ngOnInit() {
    this.refreshUnread();
  }

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
