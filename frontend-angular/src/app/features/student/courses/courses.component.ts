import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StudentApiService } from '../../../core/services/student-api.service';
import { CourseSummary } from '../../../shared/models/student.model';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="courses-page">
      <header class="page-heading">
        <div><p class="eyebrow">PARCOURS PÉDAGOGIQUE</p><h1>Mes cours</h1>
          <p>Retrouvez vos enseignements, leurs ressources et les personnes qui vous accompagnent.</p></div>
        <span class="course-count">{{ courses().length }} cours</span>
      </header>
      <form class="course-search" role="search" (submit)="$event.preventDefault()">
        <label for="course-search">Rechercher dans mes cours</label>
        <div class="search-control"><span aria-hidden="true">⌕</span>
          <input id="course-search" name="courseSearch" [ngModel]="q" (ngModelChange)="searchChanged($event)"
            placeholder="Nom du cours ou code…" autocomplete="off">
          @if (q) { <button type="button" aria-label="Effacer la recherche" (click)="searchChanged('')">×</button> }
        </div>
        <small>La recherche porte uniquement sur les cours auxquels vous êtes inscrit·e.</small>
      </form>
      @if (loading()) { <p class="status loading" role="status">Chargement de vos cours…</p> }
      @if (error()) { <div class="status error" role="alert"><span>{{ error() }}</span><button type="button" (click)="load()">Réessayer</button></div> }
      @if (!loading() && !error() && courses().length===0) {
        <div class="empty"><span aria-hidden="true">▤</span><h2>{{ q ? 'Aucun résultat' : 'Aucun cours pour le moment' }}</h2>
          <p>{{ q ? 'Essayez un autre nom ou code de cours.' : 'Vos cours apparaîtront ici dès que votre classe sera inscrite.' }}</p>
        </div>
      } @else if (courses().length) {
        <ul class="course-list">
          @for (c of courses(); track c.id) {
            <li><a class="course-item" [routerLink]="['/student/courses', c.id]">
              <span class="course-symbol" aria-hidden="true">▤</span>
              <span class="course-content"><small>{{ c.code }}</small><strong>{{ c.title }}</strong><span>{{ c.teacherName }}</span></span>
              <span class="course-arrow" aria-hidden="true">↗</span>
            </a></li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:#292a4d}.courses-page{width:min(1040px,100%);margin:0 auto}
    .page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:6px 0 23px}
    .eyebrow{margin:0 0 7px;color:#625c9e;font-size:11px;font-weight:850;letter-spacing:1.3px}
    h1{margin:0;font-size:clamp(25px,3vw,34px);letter-spacing:-1px}
    .page-heading p:not(.eyebrow){margin:8px 0 0;color:#76748a;font-size:13px;line-height:1.55}
    .course-count{padding:8px 11px;border:1px solid #e8e6f3;border-radius:8px;color:#5e5897;background:#fff;font-size:12px;font-weight:750;white-space:nowrap}
    .course-search{display:grid;gap:7px;margin:0 0 19px;padding:17px;border:1px solid #e8e6f2;border-radius:13px;background:#fff;box-shadow:0 6px 24px rgb(48 43 112 / 3%)}
    .course-search label{font-size:12px;font-weight:750}.course-search small{color:#68657d;font-size:12px}
    .search-control{display:flex;height:42px;align-items:center;gap:9px;padding:0 11px;border:1px solid #e4e2ed;border-radius:8px;background:#fafafe}
    .search-control:focus-within{border-color:#9c95d7;box-shadow:0 0 0 3px rgb(156 149 215 / 15%)}
    .search-control>span{color:#716aae;font-size:20px}.search-control input{width:100%;border:0;outline:0;background:transparent;color:#353450;font:inherit;font-size:12px}
    .search-control button{border:0;background:none;color:#716aae;font-size:20px;cursor:pointer}
    .course-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0;padding:0;list-style:none}
    .course-list li{min-width:0}.course-item{display:flex;min-height:105px;align-items:center;gap:13px;padding:16px;border:1px solid #e8e6f1;border-radius:12px;color:inherit;background:#fff;box-shadow:0 5px 20px rgb(44 41 98 / 3%);text-decoration:none;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
    .course-item:hover{transform:translateY(-2px);border-color:#cbc7e7;box-shadow:0 10px 24px rgb(44 41 98 / 7%)}
    .course-item:focus-visible{outline:3px solid #a9a3df;outline-offset:3px}
    .course-symbol{display:grid;width:40px;height:40px;flex:none;place-items:center;border:1px solid #e6e3f7;border-radius:11px;color:#625ba5;background:#f3f1fd;font-size:17px}
    .course-content{display:grid;min-width:0;gap:4px}.course-content small{color:#625c9e;font-size:11px;font-weight:850;letter-spacing:.7px}
    .course-content strong{overflow:hidden;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.course-content span{color:#656277;font-size:12px}
    .course-arrow{margin-left:auto;color:#746eae;font-size:16px}
    .status{padding:12px 14px;border-radius:9px;font-size:12px}.loading{color:#716d88;background:#f1f0fa}.error{display:flex;justify-content:space-between;gap:12px;color:#993f3a;background:#fff0ef}
    .error button{border:0;color:#87423e;background:none;font:inherit;font-weight:750;text-decoration:underline;cursor:pointer}
    .empty{display:grid;justify-items:center;padding:47px 18px;border:1px dashed #dedbed;border-radius:12px;background:rgb(255 255 255 / 70%);text-align:center}
    .empty>span{color:#7771b4;font-size:23px}.empty h2{margin:11px 0 4px;font-size:15px}.empty p{margin:0;color:#77758d;font-size:12px}
    @media(max-width:620px){.page-heading{align-items:flex-start}.course-list{grid-template-columns:1fr}.course-item{min-height:88px}}
  `]
})
export class CoursesComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();
  readonly courses = signal<CourseSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  q = '';
  ngOnInit() {
    this.searchTerms.pipe(debounceTime(220), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.load(value));
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.q = params.get('q') ?? '';
      this.load(this.q);
    });
  }
  searchChanged(value: string) {
    this.q = value;
    this.searchTerms.next(value);
  }
  load(query = this.q) {
    this.loading.set(true);
    this.error.set('');
    this.api.courses(query).subscribe({
      next: list => {
        this.courses.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les cours.');
        this.loading.set(false);
      },
    });
  }
}
