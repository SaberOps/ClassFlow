import { Component, OnInit, inject, signal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/auth.service';
import { StudentApiService } from '../../core/services/student-api.service';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <div class="layout">
      <aside aria-label="Espace étudiant">
        <a class="brand" routerLink="/student/dashboard">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span>ClassFlow<small>ESPACE ÉTUDIANT</small></span>
        </a>
        <p class="nav-label">MENU PRINCIPAL</p>
        <nav aria-label="Navigation étudiant">
          <a routerLink="/student/dashboard" routerLinkActive="on"><span aria-hidden="true">⌂</span>Tableau de bord</a>
          <a routerLink="/student/courses" routerLinkActive="on"><span aria-hidden="true">▤</span>Cours</a>
          <a routerLink="/student/assignments" routerLinkActive="on"><span aria-hidden="true">✓</span>Devoirs</a>
          <a routerLink="/student/grades" routerLinkActive="on"><span aria-hidden="true">▥</span>Notes</a>
          <a routerLink="/student/timetable" routerLinkActive="on"><span aria-hidden="true">▦</span>Emploi du temps</a>
          <a routerLink="/student/attendance" routerLinkActive="on"><span aria-hidden="true">◷</span>Présences</a>
          <a routerLink="/student/request-documents" routerLinkActive="on"><span aria-hidden="true">▧</span>Documents</a>
          <a routerLink="/student/notifications" routerLinkActive="on"><span aria-hidden="true">♢</span>Notifications <b>{{ unread() }}</b></a>
          <a routerLink="/student/teachers" routerLinkActive="on"><span aria-hidden="true">♧</span>Enseignants</a>
          <a routerLink="/student/messages" routerLinkActive="on"><span aria-hidden="true">✉</span>Mini-chat</a>
          <a routerLink="/student/feed" routerLinkActive="on"><span aria-hidden="true">◷</span>Fil d’actualités</a>
        </nav>
        <div class="bottom">
          <a routerLink="/student/profile" routerLinkActive="on"><span aria-hidden="true">⚙</span> Mon profil</a>
          <button type="button" (click)="logout()"><span aria-hidden="true">↪</span> Déconnexion</button>
        </div>
      </aside>
      <main>
        <header class="workspace-toolbar">
          <div class="toolbar-context">
            <span class="context-mark" aria-hidden="true">✦</span>
            <div><p>ESPACE ÉTUDIANT</p><strong>{{ pageTitle() }}</strong></div>
          </div>
          <form class="workspace-search" role="search" (ngSubmit)="searchWorkspace()">
            <label class="sr-only" for="workspace-search">Rechercher dans le périmètre choisi</label>
            <span aria-hidden="true">⌕</span>
            <input id="workspace-search" name="workspaceSearch" [(ngModel)]="workspaceQuery"
              placeholder="Saisir un mot-clé…" autocomplete="off">
            <label class="sr-only" for="workspace-search-scope">Périmètre de recherche</label>
            <select id="workspace-search-scope" name="workspaceSearchScope" [(ngModel)]="workspaceSearchScope"
              aria-label="Périmètre de recherche">
              <option value="courses">Cours</option>
              <option value="documents">Documents</option>
            </select>
            <button type="submit">Rechercher</button>
          </form>
          <div class="toolbar-links">
            <a routerLink="/student/courses">Mes cours</a>
            <a routerLink="/student/request-documents">Documents</a>
          </div>
        </header>
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

    .brand small {
      display: block;
      margin-top: 3px;
      color: #c0bddf;
      font-size: 10px;
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
    .nav-label { margin: 0 10px 10px; color: #d3d0f0; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; }
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
      font-size: 12px;
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
    nav a b { margin-left: auto; padding: 2px 7px; border: 1px solid rgb(255 255 255 / 12%); border-radius: 20px; color: #fff; background: rgb(255 255 255 / 11%); font-size: 10px; }
    .bottom { display: grid; gap: 4px; margin-top: auto; padding-top: 14px; border-top: 1px solid rgb(230 228 250 / 14%); }
    .bottom button { width: 100%; border: 0; background: transparent; cursor: pointer; font: inherit; text-align: left; }
    main { min-width: 0; flex: 1; padding: 0 34px 30px; }
    .workspace-toolbar { position: sticky; z-index: 4; top: 0; display: flex; min-height: 82px; align-items: center; gap: 20px; margin: 0 -34px 28px; padding: 14px 34px; border-bottom: 1px solid #eae8f3; background: rgb(255 255 255 / 94%); box-shadow: 0 5px 20px rgb(40 38 88 / 3%); }
    .toolbar-context { display: flex; min-width: 175px; align-items: center; gap: 10px; }
    .toolbar-context p { margin: 0 0 4px; color: #625c9e; font-size: 11px; font-weight: 850; letter-spacing: 1.1px; }
    .toolbar-context strong { color: #292a4d; font-size: 14px; letter-spacing: -.3px; }
    .context-mark { display: grid; width: 35px; height: 35px; place-items: center; border: 1px solid #e6e3f7; border-radius: 11px; color: #615ba5; background: #f3f1fd; font-size: 16px; }
    .workspace-search { display: flex; height: 42px; min-width: 180px; flex: 1; align-items: center; gap: 9px; padding: 0 7px 0 12px; border: 1px solid #e4e2ef; border-radius: 10px; background: #f9f9fd; }
    .workspace-search:focus-within { border-color: #9c95d7; box-shadow: 0 0 0 3px rgb(156 149 215 / 15%); }
    .workspace-search > span { color: #7b75b5; font-size: 21px; line-height: 1; }
    .workspace-search input { width: 100%; min-width: 0; flex: 1; border: 0; outline: 0; color: #353450; background: transparent; font: inherit; font-size: 12px; }
    .workspace-search input::placeholder { color: #9491a5; }
    .workspace-search select { min-width: 100px; height: 30px; padding: 0 7px; border: 1px solid #dedbea; border-radius: 7px; color: #4b477a; background: #fff; font: inherit; font-size: 12px; }
    .workspace-search button { height: 32px; padding: 0 11px; border: 0; border-radius: 7px; color: #fff; background: #554da0; font-size: 12px; font-weight: 750; cursor: pointer; }
    .toolbar-links { display: flex; align-items: center; gap: 13px; white-space: nowrap; }
    .toolbar-links a { color: #554f91; font-size: 12px; font-weight: 700; text-decoration: none; }
    .toolbar-links a:hover { color: #393575; text-decoration: underline; text-underline-offset: 3px; }
    .workspace-search button:focus-visible, .workspace-search select:focus-visible, .workspace-search input:focus-visible, .toolbar-links a:focus-visible { outline: 3px solid #a9a3df; outline-offset: 2px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

    @media (max-width: 760px) {
      .layout { display: block; }
      aside { position: static; width: auto; height: auto; overflow: visible; padding: 12px 14px 10px; }
      .brand { padding: 0 4px 11px; }
      .nav-label { display: none; }
      nav { display: flex; gap: 5px; overflow-x: auto; padding: 0 0 3px; scrollbar-width: thin; }
      nav a { min-height: 38px; flex: 0 0 auto; padding: 8px 10px; font-size: 12px; }
      nav a span { display: none; }
      nav a.on { box-shadow: inset 0 -2px #b2aaff; }
      .bottom { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 6px; padding-top: 8px; }
      .bottom > a, .bottom button { justify-content: center; min-height: 38px; padding: 8px 6px; font-size: 12px; }
      main { padding: 0 14px 17px; }
      .workspace-toolbar { position: static; flex-wrap: wrap; gap: 11px; margin: 0 -14px 18px; padding: 12px 14px; }
      .toolbar-context { min-width: 0; flex: 1; }
      .toolbar-links { width: 100%; justify-content: flex-end; gap: 17px; }
      .workspace-search { order: 2; flex-basis: 100%; }
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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly unread = signal(0);
  workspaceQuery = '';
  workspaceSearchScope: 'courses' | 'documents' = 'courses';

  pageTitle(): string {
    const path = this.router.url.split('?')[0];
    if (path.includes('/request-documents')) return 'Documents de cours';
    if (path.includes('/courses')) return 'Mes cours';
    if (path.includes('/timetable')) return 'Emploi du temps';
    if (path.includes('/assignments')) return 'Devoirs';
    if (path.includes('/grades')) return 'Notes';
    return 'Votre espace d’apprentissage';
  }

  searchWorkspace(): void {
    const target = this.workspaceSearchScope === 'documents'
      ? '/student/request-documents'
      : '/student/courses';
    this.router.navigate([target], { queryParams: { q: this.workspaceQuery.trim() || null } });
  }

  ngOnInit() {
    this.refreshUnread();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.workspaceQuery = params.get('q') ?? '';
      this.workspaceSearchScope = this.router.url.includes('/student/request-documents') ? 'documents' : 'courses';
    });
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
