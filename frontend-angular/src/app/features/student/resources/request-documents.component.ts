import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StudentApiService } from '../../../core/services/student-api.service';
import { CourseResource } from '../../../shared/models/student.model';

@Component({
  selector: 'app-request-documents',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <section class="documents-page">
      <header class="page-heading">
        <div><p class="eyebrow">RESSOURCES PÉDAGOGIQUES</p><h1>Documents de cours</h1>
          <p>Un accès rapide aux ressources partagées dans vos cours.</p></div>
        <span class="result-count">{{ docs().length }} ressource{{ docs().length > 1 ? 's' : '' }}</span>
      </header>
      <form class="document-search" role="search" (submit)="$event.preventDefault()">
        <label for="document-search">Rechercher un document</label>
        <div class="search-control"><span aria-hidden="true">⌕</span>
          <input id="document-search" name="documentSearch" [ngModel]="q" (ngModelChange)="searchChanged($event)"
            placeholder="Titre, fichier ou cours…" autocomplete="off">
          @if (q) { <button type="button" aria-label="Effacer la recherche" (click)="searchChanged('')">×</button> }
        </div>
        <small>Seuls les documents de vos cours inscrits sont affichés.</small>
      </form>

      @if (loading()) { <p class="status loading" role="status">Recherche des ressources…</p> }
      @if (error()) { <div class="status error" role="alert"><span>{{ error() }}</span><button type="button" (click)="load()">Réessayer</button></div> }
      @if (!loading() && !error() && docs().length === 0) {
        <div class="empty"><span aria-hidden="true">▧</span>
          <h2>{{ q ? 'Aucun document trouvé' : 'Aucun document partagé' }}</h2>
          <p>{{ q ? 'Essayez un autre mot-clé.' : 'Les ressources de vos cours apparaîtront ici.' }}</p>
        </div>
      } @else if (docs().length) {
        <ul class="document-list">
          @for (doc of docs(); track doc.id) {
            <li class="document-row">
              <span class="file-mark" aria-hidden="true">{{ doc.resourceType === 'LINK' ? '↗' : '▤' }}</span>
              <div class="document-main"><small>{{ doc.courseCode }} · {{ doc.courseTitle }}</small>
                <strong>{{ doc.title }}</strong><span>{{ doc.contentBody || doc.fileName || 'Ressource de cours' }}</span></div>
              <time [attr.datetime]="doc.publishedAt">{{ doc.publishedAt | date:'d MMM y' }}</time>
              @if (doc.fileUrl) {
                <a class="open-link" [href]="doc.fileUrl" target="_blank" rel="noopener noreferrer"
                  [attr.aria-label]="'Ouvrir ' + doc.title + ', cours ' + doc.courseTitle">Ouvrir <span aria-hidden="true">↗</span></a>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    :host{display:block;color:#292a4d}.documents-page{width:min(1040px,100%);margin:0 auto}
    .page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:6px 0 23px}
    .eyebrow{margin:0 0 7px;color:#625c9e;font-size:11px;font-weight:850;letter-spacing:1.3px}
    h1{margin:0;font-size:clamp(25px,3vw,34px);letter-spacing:-1px}
    .page-heading p:not(.eyebrow){margin:8px 0 0;color:#76748a;font-size:13px;line-height:1.55}
    .result-count{padding:8px 11px;border:1px solid #e8e6f3;border-radius:8px;color:#5e5897;background:#fff;font-size:12px;font-weight:750;white-space:nowrap}
    .document-search{display:grid;gap:7px;margin:0 0 19px;padding:17px;border:1px solid #e8e6f2;border-radius:13px;background:#fff;box-shadow:0 6px 24px rgb(48 43 112 / 3%)}
    .document-search label{font-size:12px;font-weight:750}.document-search small{color:#68657d;font-size:12px}
    .search-control{display:flex;height:42px;align-items:center;gap:9px;padding:0 11px;border:1px solid #e4e2ed;border-radius:8px;background:#fafafe}
    .search-control:focus-within{border-color:#9c95d7;box-shadow:0 0 0 3px rgb(156 149 215 / 15%)}
    .search-control>span{color:#716aae;font-size:20px}.search-control input{width:100%;border:0;outline:0;background:transparent;color:#353450;font:inherit;font-size:12px}
    .search-control button{border:0;background:none;color:#716aae;font-size:20px;cursor:pointer}
    .document-list{margin:0;padding:0;border:1px solid #e8e6f1;border-radius:12px;background:#fff;list-style:none;overflow:hidden}
    .document-row{display:flex;min-height:84px;align-items:center;gap:14px;padding:14px 17px;border-bottom:1px solid #efedf5}
    .document-row:last-child{border-bottom:0}.file-mark{display:grid;width:38px;height:38px;flex:none;place-items:center;border:1px solid #e6e3f7;border-radius:10px;color:#625ba5;background:#f3f1fd;font-size:17px}
    .document-main{display:grid;min-width:0;flex:1;gap:3px}.document-main small{overflow:hidden;color:#625c9e;font-size:11px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}
    .document-main strong{overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.document-main span{overflow:hidden;color:#656277;font-size:12px;text-overflow:ellipsis;white-space:nowrap}
    time{color:#656277;font-size:12px;white-space:nowrap}.open-link{padding:8px 10px;border:1px solid #e5e2f0;border-radius:7px;color:#514a91;font-size:12px;font-weight:750;text-decoration:none;white-space:nowrap}
    .open-link:hover{border-color:#c9c4e6;background:#f7f6fc}.open-link:focus-visible,.search-control button:focus-visible{outline:3px solid #a9a3df;outline-offset:2px}
    .status{padding:12px 14px;border-radius:9px;font-size:12px}.loading{color:#716d88;background:#f1f0fa}.error{display:flex;justify-content:space-between;gap:12px;color:#993f3a;background:#fff0ef}
    .error button{border:0;color:#87423e;background:none;font:inherit;font-weight:750;text-decoration:underline;cursor:pointer}
    .empty{display:grid;justify-items:center;padding:47px 18px;border:1px dashed #dedbed;border-radius:12px;background:rgb(255 255 255 / 70%);text-align:center}
    .empty>span{color:#7771b4;font-size:23px}.empty h2{margin:11px 0 4px;font-size:15px}.empty p{margin:0;color:#77758d;font-size:12px}
    @media(max-width:640px){.page-heading{align-items:flex-start}.document-row{flex-wrap:wrap;gap:10px;padding:13px}.document-main{flex-basis:calc(100% - 55px)}.document-row time{margin-left:48px}.open-link{margin-left:auto}}
  `]
})
export class RequestDocumentsComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();
  readonly docs = signal<CourseResource[]>([]);
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
    this.api.resources(query).subscribe({
      next: items => { this.docs.set(items); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les documents.'); this.loading.set(false); }
    });
  }
}
