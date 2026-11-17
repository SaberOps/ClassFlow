import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeacherApiService, TeacherCourse, TeacherCourseStudent, TeacherResource } from '../../../core/services/teacher-api.service';
import { validateUploadFile } from '../../../shared/validation/file-upload.validation';

interface ClassSpace {
  name: string;
  courses: TeacherCourse[];
}

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <p class="eyebrow">ESPACE PÉDAGOGIQUE</p>
          <h1>Mes cours</h1>
          <p>Retrouvez les supports et ressources, organisés par classe.</p>
        </div>
        <button type="button" class="primary" (click)="toggleCourseCreate()">
          {{ courseCreateOpen() ? 'Fermer' : 'Créer un cours' }}
        </button>
        @if (courses().length) {
          <div class="course-total"><span aria-hidden="true">▤</span><strong>{{ courses().length }}</strong><span>cours</span></div>
        }
      </header>

      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
      @if (courseCreateOpen()) {
        <form class="editor create-course-form" (ngSubmit)="createCourse()">
          <div class="editor-head"><div><p class="eyebrow">NOUVEAU COURS</p><h2>Créer un cours que vous enseignerez</h2></div></div>
          <label for="course-title">Titre du cours
            <input id="course-title" name="courseTitle" [(ngModel)]="courseTitle" maxlength="200" required [disabled]="savingCourse()" placeholder="Ex. Introduction à la biologie" />
          </label>
          <label for="course-description">Description
            <textarea id="course-description" name="courseDescription" [(ngModel)]="courseDescription" maxlength="5000" rows="3" [disabled]="savingCourse()" placeholder="Présentez brièvement le cours (facultatif)…"></textarea>
          </label>
          <p class="panel-footnote">Le cours sera créé dans votre espace et pourra ensuite être assigné à une classe par l’administration.</p>
          <div class="actions">
            <button class="primary" type="submit" [disabled]="savingCourse() || !courseTitle.trim()">{{ savingCourse() ? 'Création…' : 'Créer le cours' }}</button>
            <button class="secondary" type="button" [disabled]="savingCourse()" (click)="courseCreateOpen.set(false)">Annuler</button>
          </div>
        </form>
      }
      @if (loadingCourses()) {
        <section class="loading-panel" role="status"><span class="loader" aria-hidden="true"></span>Chargement de vos espaces de classe…</section>
      } @else if (!courses().length) {
        <section class="empty">
          <span class="empty-mark" aria-hidden="true">▤</span>
          <h2>Aucun cours ne vous est encore affecté</h2>
          <p>Les espaces de classe apparaîtront ici dès que vos cours vous seront assignés.</p>
        </section>
      } @else {
        <section class="class-switcher" aria-label="Espaces de classe">
          <div class="switcher-heading">
            <div><p class="eyebrow">VOS ESPACES</p><h2>Choisir une classe</h2></div>
            <span class="class-total">{{ classSpaces().length }} {{ classSpaces().length === 1 ? 'classe' : 'classes' }}</span>
          </div>
          <div class="class-tabs">
            @for (space of classSpaces(); track space.name) {
              <button type="button" class="class-tab" [class.active]="selectedClassName() === space.name"
                [attr.aria-pressed]="selectedClassName() === space.name" (click)="selectClass(space.name)">
                <span class="class-mark" aria-hidden="true">{{ classInitial(space.name) }}</span>
                <span class="tab-copy"><strong>{{ space.name }}</strong><small>{{ space.courses.length }} cours</small></span>
                <span class="tab-arrow" aria-hidden="true">›</span>
              </button>
            }
          </div>
        </section>

        <section class="workbench" aria-label="Espace de cours">
          <aside class="course-panel" aria-label="Cours de la classe sélectionnée">
            <div class="class-heading">
              <span class="class-overline"><span class="live-dot"></span> ESPACE DE CLASSE</span>
              <h2>{{ selectedClassName() }}</h2>
              <p>{{ visibleCourses().length }} {{ visibleCourses().length === 1 ? 'cours disponible' : 'cours disponibles' }}</p>
            </div>
            @if (visibleCourses().length > 1) {
              <label for="course">Cours à consulter</label>
              <select id="course" [ngModel]="selectedCourseId()" (ngModelChange)="selectCourse($event)">
                @for (course of visibleCourses(); track course.id) { <option [ngValue]="course.id">{{ course.title }} · {{ course.code }}</option> }
              </select>
            }
            @if (selectedCourse(); as course) {
              <div class="course-note">
                <span class="course-code">{{ course.code }}</span>
                <h3>{{ course.title }}</h3>
                @if (course.description) { <p>{{ course.description }}</p> }
                <span class="course-class"><span aria-hidden="true">▦</span>{{ course.className || 'Classe non précisée' }}</span>
              </div>
            }
            <button type="button" class="primary add-button" [disabled]="!selectedCourse()" (click)="newResource()">
              <span aria-hidden="true">＋</span> Déposer un contenu
            </button>
            <button type="button" class="secondary add-button roster-button" [disabled]="!selectedCourse()" (click)="toggleRoster()">
              {{ rosterOpen() ? 'Masquer les étudiants' : 'Voir les étudiants inscrits' }}
            </button>
            @if (rosterOpen()) {
              <section class="course-roster" aria-label="Étudiants inscrits au cours">
                <h3>Étudiants · {{ selectedCourse()?.title }}</h3>
                @if (loadingRoster()) {
                  <p role="status">Chargement des étudiants…</p>
                } @else {
                  <ul>
                    @for (student of roster(); track student.id) {
                      <li><strong>{{ student.firstName }} {{ student.lastName }}</strong><small>{{ student.email }}</small></li>
                    } @empty {
                      <li>Aucun étudiant inscrit pour le moment.</li>
                    }
                  </ul>
                }
              </section>
            }
            <p class="panel-footnote">Le contenu publié est visible dans le cours sélectionné.</p>
          </aside>

          <section class="content" aria-label="Ressources publiées pour le cours sélectionné">
            @if (formOpen()) {
              <form class="editor" (ngSubmit)="saveResource()">
                <div class="editor-head">
                  <div><p class="eyebrow">{{ editingId() ? 'MISE À JOUR' : 'NOUVELLE PUBLICATION' }}</p><h2>{{ editingId() ? 'Modifier le contenu' : 'Déposer un contenu' }}</h2></div>
                  <button class="close" type="button" aria-label="Fermer le formulaire" [disabled]="saving()" (click)="closeForm()">×</button>
                </div>

                <div class="destination">
                  <span class="destination-icon" aria-hidden="true">↳</span>
                  <div><small>DESTINATION DE PUBLICATION</small><strong>{{ formClassName || 'Choisissez une classe' }}</strong><span>{{ selectedFormCourse()?.title || 'Choisissez un cours' }}</span></div>
                  <span class="destination-check" aria-hidden="true">✓</span>
                </div>

                <div class="target-fields">
                  <label for="target-class">Classe de destination
                    <select id="target-class" name="targetClass" [ngModel]="formClassName" (ngModelChange)="selectFormClass($event)" [disabled]="!!editingId() || saving()" required>
                      <option value="" disabled>Choisir une classe</option>
                      @for (space of classSpaces(); track space.name) { <option [ngValue]="space.name">{{ space.name }}</option> }
                    </select>
                  </label>
                  <label for="target-course">Cours de destination
                    <select id="target-course" name="targetCourse" [(ngModel)]="formCourseId" [disabled]="!!editingId() || saving() || !coursesInClass(formClassName).length" required>
                      <option [ngValue]="null" disabled>Choisir un cours</option>
                      @for (course of coursesInClass(formClassName); track course.id) { <option [ngValue]="course.id">{{ course.title }} · {{ course.code }}</option> }
                    </select>
                  </label>
                </div>
                @if (editingId()) { <p class="locked-note">La classe et le cours d’origine ne peuvent pas être modifiés.</p> }

                <label for="resource-title">Titre
                  <input id="resource-title" name="title" [(ngModel)]="title" maxlength="200" required [disabled]="saving()" placeholder="Ex. Chapitre 3 — Les fonctions" />
                </label>
                <label for="resource-type">Type de contenu
                  <select id="resource-type" name="resourceType" [(ngModel)]="resourceType" [disabled]="saving()">
                    <option value="TEXT">Texte de cours</option><option value="LINK">Lien externe</option><option value="FILE">Fichier</option>
                  </select>
                </label>
                @if (resourceType === 'TEXT') {
                  <label for="resource-body">Contenu
                    <textarea id="resource-body" name="contentBody" [(ngModel)]="contentBody" rows="5" maxlength="20000" required [disabled]="saving()" placeholder="Rédigez les consignes ou le contenu à partager…"></textarea>
                  </label>
                } @else if (resourceType === 'FILE') {
                  <label for="resource-file">Fichier <span class="field-note">PDF, DOCX, PPTX, JPG ou PNG · 10 MiB max</span>
                    <input id="resource-file" name="file" type="file" accept=".pdf,.docx,.pptx,.jpg,.png" [disabled]="saving()" (change)="selectFile($event)" />
                  </label>
                  @if (fileName) { <small class="file-feedback"><span aria-hidden="true">▧</span> {{ fileName }} <span>{{ selectedFile ? 'Prêt à téléverser' : 'Fichier actuel' }}</span></small> }
                } @else {
                  <label for="resource-link">Adresse du lien
                    <input id="resource-link" name="fileUrl" type="url" [(ngModel)]="fileUrl" maxlength="500" required [disabled]="saving()" placeholder="https://…" />
                  </label>
                }
                <div class="actions">
                  <button class="primary" type="submit" [disabled]="saving() || !formCourseId">{{ saving() ? 'Publication…' : (editingId() ? 'Enregistrer' : 'Publier dans ce cours') }}</button>
                  <button type="button" class="secondary" [disabled]="saving()" (click)="closeForm()">Annuler</button>
                </div>
              </form>
            }

            <div class="list-head">
              <div><p class="eyebrow">BIBLIOTHÈQUE DE CLASSE</p><h2>{{ selectedCourse()?.title || 'Contenu du cours' }}</h2><p class="list-context">{{ selectedClassName() }} <span aria-hidden="true">·</span> ressources de ce cours uniquement</p></div>
              <span class="count" [attr.aria-label]="resources().length + ' ressources'">{{ resources().length }}</span>
            </div>
            @if (loadingResources()) {
              <p class="loading" role="status"><span class="loader small" aria-hidden="true"></span>Chargement des ressources…</p>
            } @else if (!resources().length) {
              <div class="empty compact"><span class="empty-mark" aria-hidden="true">✧</span><h3>La bibliothèque est prête</h3><p>Ajoutez le premier support ou la première consigne à ce cours.</p><button type="button" class="text-action" (click)="newResource()">＋ Déposer une ressource</button></div>
            } @else {
              @for (resource of resources(); track resource.id) {
                <article class="resource">
                  <div class="resource-mark" [class]="resource.resourceType.toLowerCase()">{{ iconFor(resource.resourceType) }}</div>
                  <div class="resource-main">
                    <div class="title-row"><h3>{{ resource.title }}</h3><span class="type">{{ typeLabel(resource.resourceType) }}</span></div>
                    @if (resource.resourceType === 'TEXT') { <p class="body">{{ resource.contentBody }}</p> }
                    @if (resource.resourceType !== 'TEXT') { <a class="file-link" [href]="resource.fileUrl" target="_blank" rel="noopener noreferrer">{{ resource.fileName || resource.fileUrl }} ↗</a> }
                    <small>Publié le {{ resource.publishedAt | date:'d MMM y · HH:mm' }}@if (resource.updatedAt) { <span> · Modifié le {{ resource.updatedAt | date:'d MMM y · HH:mm' }}</span> }</small>
                  </div>
                  <div class="resource-actions"><button type="button" (click)="editResource(resource)">Modifier</button><button type="button" class="delete" (click)="deleteResource(resource)">Supprimer</button></div>
                </article>
              }
            }
          </section>
        </section>
      }
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1220px;margin:auto;color:#292a4d}*{box-sizing:border-box}
    .page{display:grid;gap:18px}.page-head{display:flex;align-items:flex-end;justify-content:space-between}
    .eyebrow{margin:0 0 7px;color:#7771b4;font-size:.66rem;font-weight:850;letter-spacing:.14em}
    h1{margin:0;font-size:2rem;letter-spacing:-.05em}.page-head p:last-child{margin:7px 0 0;color:#77758d;font-size:.88rem}
    .class-switcher,.course-panel,.content{min-width:0;border:1px solid #e8e7f2;border-radius:16px;background:#fff;box-shadow:0 5px 18px rgb(48 43 112 / 3%)}
    .workbench{display:grid;grid-template-columns:270px minmax(0,1fr);gap:14px;align-items:start}
    .course-panel{position:sticky;top:18px;padding:18px}
    .course-panel>label,.editor label{display:grid;gap:6px;color:#4b4967;font-size:.74rem;font-weight:750}
    .course-panel select,.editor input,.editor select,.editor textarea{width:100%;min-width:0;padding:10px 11px;border:1px solid #dedde9;border-radius:9px;color:#33324f;background:#fff;font:inherit;font-size:.8rem}
    .course-panel select:focus,.editor input:focus,.editor select:focus,.editor textarea:focus{border-color:#8e86ce;outline:3px solid rgb(142 134 206 / 18%)}
    .course-note{display:grid;gap:5px;margin:17px 0;padding:15px 0;border-top:1px solid #efedf5;border-bottom:1px solid #efedf5}
    .course-note h3{margin:0;color:#393750;font-size:.94rem}.course-note p{margin:2px 0;color:#77758d;font-size:.74rem;line-height:1.5}
    .primary,.secondary{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 13px;border:0;border-radius:9px;font:inherit;font-size:.76rem;font-weight:750;cursor:pointer;transition:background .16s ease,transform .16s ease}
    .primary{color:white;background:#393575}.primary:hover{background:#2c2a61;transform:translateY(-1px)}.primary:disabled{opacity:.55;cursor:not-allowed;transform:none}.add-button{width:100%}.add-button span{font-size:1rem}
    .secondary{color:#514e76;background:#f0eff8}.secondary:hover{background:#e8e6f4}
    .panel-footnote{margin:10px 0 0;color:#8b889c;font-size:.66rem;line-height:1.45}
    .course-roster{margin-top:12px;padding-top:12px;border-top:1px solid #efedf5}
    .content{padding:19px}.list-head,.editor-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.list-head{margin-bottom:10px}.list-head h2,.editor-head h2{margin:0;color:#34324f;font-size:1.12rem;letter-spacing:-.025em}.list-head .eyebrow{margin-bottom:4px}
    .list-context{margin:5px 0 0;color:#858297;font-size:.72rem}.list-context span{padding:0 3px;color:#b1adbf}
    .count{display:grid;width:30px;height:30px;flex:0 0 auto;place-items:center;border:1px solid #e9e6f5;border-radius:9px;color:#655ca9;background:#f6f5fc;font-size:.75rem;font-weight:800}
    .editor{display:grid;gap:12px;margin:0 0 20px;padding:17px;border:1px solid #dcd9f1;border-radius:13px;background:linear-gradient(135deg,#fbfaff,#f8f7fd)}
    .editor-head{margin-bottom:1px}.editor-head .eyebrow{margin-bottom:4px}    .close{width:33px;height:33px;border:0;border-radius:8px;color:#625b99;background:#efedf9;font-size:1.25rem;cursor:pointer}.close:hover{background:#e5e2f5}.close:disabled,.secondary:disabled{opacity:.5;cursor:wait}
    .destination{display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid #e4e0f5;border-radius:10px;background:#f3f1fc}
    .destination-icon{display:grid;width:29px;height:29px;flex:0 0 auto;place-items:center;border-radius:8px;color:#fff;background:#554d98;font-size:1.05rem}
    .destination>div{display:grid;min-width:0;gap:3px;flex:1}.destination small{color:#7973a7;font-size:.56rem;font-weight:850;letter-spacing:.12em}.destination strong{overflow:hidden;color:#37345d;font-size:.79rem;text-overflow:ellipsis;white-space:nowrap}.destination>div span{overflow:hidden;color:#77758d;font-size:.69rem;text-overflow:ellipsis;white-space:nowrap}.destination-check{color:#4b8a69;font-size:.9rem;font-weight:900}
    .target-fields{display:grid;grid-template-columns:1fr 1.15fr;gap:10px}.editor select:disabled{color:#5d5a78;background:#f3f2f7;opacity:1}.locked-note{margin:-6px 0 0;color:#858297;font-size:.67rem}
    .editor textarea{resize:vertical;min-height:110px}.field-note{color:#89869a;font-size:.68rem;font-weight:500}.editor input[type=file]{padding:9px;background:#fff}
    .file-feedback{display:flex;align-items:center;gap:6px;min-width:0;margin-top:-5px;color:#514b91;font-size:.72rem;overflow-wrap:anywhere}.file-feedback span:last-child{margin-left:auto;color:#88859a;font-size:.65rem}
    .actions{display:flex;gap:8px;margin-top:2px}
    .resource{display:flex;gap:13px;align-items:flex-start;padding:15px 0;border-top:1px solid #efedf5}
    .resource-mark{display:grid;width:37px;height:37px;flex:0 0 auto;place-items:center;border-radius:10px;color:#665da8;background:#f0effb;font-size:1rem}
    .resource-mark.link{color:#34765a;background:#edf7f0}.resource-mark.file{color:#98612e;background:#fff4e8}
    .resource-main{min-width:0;flex:1}.title-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.resource h3{margin:0;color:#393750;font-size:.87rem}
    .type{padding:3px 7px;border-radius:20px;color:#7771b4;background:#f4f2fc;font-size:.59rem;font-weight:850;letter-spacing:.04em}
    .body{max-width:850px;margin:7px 0;color:#68667c;font-size:.77rem;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
    .file-link{display:block;margin:7px 0;color:#514b91;font-size:.76rem;overflow-wrap:anywhere}.file-link:focus-visible{outline:2px solid #8e86ce;outline-offset:3px;border-radius:2px}
    .resource-main small{display:block;margin-top:8px;color:#9491a2;font-size:.66rem}
    .resource-actions{display:flex;gap:5px}.resource-actions button{padding:7px 8px;border:1px solid #e4e2ed;border-radius:8px;color:#5d588d;background:#fff;font:inherit;font-size:.68rem;font-weight:700;cursor:pointer}.resource-actions button:hover{background:#f8f7fc}.resource-actions .delete{color:#a24542}
    .empty{padding:38px 20px;border:1px dashed #dedced;border-radius:16px;color:#77758d;background:#fff;text-align:center}.empty-mark{display:inline-grid;width:42px;height:42px;place-items:center;border-radius:13px;color:#7068b5;background:#f0effb;font-size:1.35rem}
    .empty h2,.empty h3{margin:11px 0 6px;color:#454361;font-size:1rem}.empty p{max-width:450px;margin:0 auto;font-size:.8rem;line-height:1.55}.empty.compact{margin-top:13px;padding:28px 15px}
    .text-action{margin-top:15px;padding:7px 9px;border:0;border-radius:7px;color:#514b91;background:#f0effb;font:inherit;font-size:.73rem;font-weight:750;cursor:pointer}.text-action:hover{background:#e8e5fa}
    .loading-panel{display:flex;min-height:130px;align-items:center;justify-content:center;gap:10px;border:1px solid #e8e7f2;border-radius:15px;color:#77758d;background:#fff;font-size:.8rem}
    .loading{display:flex;align-items:center;gap:8px;margin:18px 0;color:#77758d;font-size:.78rem}
    .loader{width:16px;height:16px;border:2px solid #dedcf0;border-top-color:#6f67b2;border-radius:50%;animation:spin .8s linear infinite}.loader.small{width:13px;height:13px}
    @keyframes spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.loader{animation-duration:2s}.primary{transition:none}}
    .alert,.notice{margin:0;padding:11px 13px;border-radius:10px;font-size:.8rem}.alert{color:#9b3836;background:#fff0ef}.notice{color:#276b49;background:#edf8f1}
    @media(max-width:900px){.workbench{grid-template-columns:230px minmax(0,1fr)}.course-panel{padding:15px}.content{padding:16px}.resource{flex-wrap:wrap}.resource-actions{margin-left:50px}}
    @media(max-width:680px){.page{gap:13px}.page-head{align-items:flex-start}.page-head h1{font-size:1.75rem}.workbench{grid-template-columns:1fr}.course-panel{position:static}.content{padding:14px}.target-fields{grid-template-columns:1fr}.resource{gap:9px}.resource-actions{width:100%;margin-left:46px}.resource-actions button{flex:1}.editor{padding:13px}}
    @media(max-width:380px){.resource-mark{width:31px;height:31px}.resource-main{flex-basis:calc(100% - 44px)}.page-head p:last-child{max-width:245px;line-height:1.45}}
  `]
})
export class TeacherCoursesComponent implements OnInit {
  private readonly api = inject(TeacherApiService);
  readonly courses = signal<TeacherCourse[]>([]);
  readonly classSpaces = computed<ClassSpace[]>(() => {
    const groups = new Map<string, TeacherCourse[]>();
    for (const course of this.courses()) {
      const name = course.className?.trim() || 'Classe non précisée';
      groups.set(name, [...(groups.get(name) ?? []), course]);
    }
    return [...groups.entries()]
      .map(([name, courses]) => ({ name, courses }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  });
  readonly visibleCourses = computed(() =>
    this.classSpaces().find(space => space.name === this.selectedClassName())?.courses ?? []);
  readonly resources = signal<TeacherResource[]>([]);
  readonly selectedClassName = signal('');
  readonly selectedCourseId = signal<number | null>(null);
  readonly loadingCourses = signal(true);
  readonly loadingResources = signal(false);
  readonly loadingRoster = signal(false);
  readonly rosterOpen = signal(false);
  readonly roster = signal<TeacherCourseStudent[]>([]);
  readonly courseCreateOpen = signal(false);
  readonly savingCourse = signal(false);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly editingFileUrl = signal('');
  readonly error = signal('');
  readonly notice = signal('');
  formClassName = '';
  formCourseId: number | null = null;
  title = '';
  resourceType: 'TEXT' | 'LINK' | 'FILE' = 'TEXT';
  contentBody = '';
  fileName = '';
  fileUrl = '';
  selectedFile: File | null = null;
  courseTitle = '';
  courseDescription = '';

  ngOnInit() {
    this.api.courses().subscribe({
      next: values => {
        this.courses.set(values);
        this.loadingCourses.set(false);
        const firstSpace = this.classSpaces()[0];
        if (firstSpace) {
          this.selectedClassName.set(firstSpace.name);
          this.selectCourse(firstSpace.courses[0].id);
        }
      },
      error: () => { this.error.set('Impossible de charger vos cours.'); this.loadingCourses.set(false); }
    });
  }

  selectedCourse() { return this.courses().find(course => course.id === this.selectedCourseId()) ?? null; }
  selectedFormCourse() { return this.courses().find(course => course.id === this.formCourseId) ?? null; }
  coursesInClass(className: string) {
    return this.classSpaces().find(space => space.name === className)?.courses ?? [];
  }
  classInitial(name: string) { return name.charAt(0).toLocaleUpperCase('fr'); }

  toggleCourseCreate() {
    this.courseCreateOpen.update(open => !open);
    this.error.set('');
  }

  selectClass(name: string) {
    this.selectedClassName.set(name);
    this.notice.set('');
    this.error.set('');
    this.closeForm();
    const inClass = this.coursesInClass(name);
    const current = inClass.find(course => course.id === this.selectedCourseId());
    if (current) return;
    this.selectCourse(inClass[0]?.id ?? null);
  }

  selectCourse(id: number | null) {
    const courseId = Number(id);
    if (!Number.isFinite(courseId) || !this.visibleCourses().some(course => course.id === courseId)) return;
    this.selectedCourseId.set(courseId);
    this.resources.set([]);
    this.roster.set([]);
    this.rosterOpen.set(false);
    this.error.set('');
    this.closeForm();
    this.loadResources(courseId);
  }

  createCourse() {
    const title = this.courseTitle.trim();
    if (!title || this.savingCourse()) return;
    this.savingCourse.set(true);
    this.error.set('');
    this.api.createCourse({ title, description: this.courseDescription.trim() || undefined }).subscribe({
      next: course => {
        this.courses.update(values => [...values, course]);
        this.selectedClassName.set(course.className || 'Classe non précisée');
        this.courseCreateOpen.set(false);
        this.courseTitle = '';
        this.courseDescription = '';
        this.notice.set('Cours créé. Il est prêt à être assigné à une classe par l’administration.');
        this.selectCourse(course.id);
      },
      error: () => {
        this.error.set('La création du cours a échoué. Vérifiez le titre et réessayez.');
        this.savingCourse.set(false);
      },
      complete: () => this.savingCourse.set(false)
    });
  }

  toggleRoster() {
    const courseId = this.selectedCourseId();
    if (!courseId) return;
    if (this.rosterOpen()) {
      this.rosterOpen.set(false);
      return;
    }
    this.rosterOpen.set(true);
    this.loadingRoster.set(true);
    this.api.courseStudents(courseId).subscribe({
      next: students => {
        if (this.selectedCourseId() === courseId) this.roster.set(students);
      },
      error: () => {
        if (this.selectedCourseId() === courseId) this.error.set('Impossible de charger les étudiants inscrits.');
        this.loadingRoster.set(false);
      },
      complete: () => this.loadingRoster.set(false)
    });
  }

  loadResources(id: number) {
    this.loadingResources.set(true);
    this.error.set('');
    this.api.resources(id).subscribe({
      next: value => {
        if (this.selectedCourseId() === id) this.resources.set(value);
      },
      error: () => {
        if (this.selectedCourseId() === id) this.error.set('Impossible de charger le contenu de ce cours.');
        if (this.selectedCourseId() === id) this.loadingResources.set(false);
      },
      complete: () => {
        if (this.selectedCourseId() === id) this.loadingResources.set(false);
      }
    });
  }

  newResource() {
    this.resetForm();
    const course = this.selectedCourse();
    this.formClassName = this.selectedClassName();
    this.formCourseId = course?.id ?? null;
    this.formOpen.set(true);
    this.notice.set('');
    this.error.set('');
  }

  selectFormClass(name: string) {
    this.formClassName = name;
    this.formCourseId = this.coursesInClass(name)[0]?.id ?? null;
    this.error.set('');
  }

  editResource(resource: TeacherResource) {
    const course = this.courses().find(item => item.id === resource.courseId);
    this.resetForm();
    this.editingId.set(resource.id);
    this.editingFileUrl.set(resource.resourceType === 'FILE' ? resource.fileUrl : '');
    this.formClassName = course?.className?.trim() || 'Classe non précisée';
    this.formCourseId = resource.courseId;
    this.title = resource.title;
    this.resourceType = resource.resourceType;
    this.contentBody = resource.contentBody ?? '';
    this.fileName = resource.fileName ?? '';
    this.fileUrl = resource.fileUrl ?? '';
    this.formOpen.set(true);
    this.notice.set('');
    this.error.set('');
  }

  closeForm() { this.formOpen.set(false); this.resetForm(); }

  private resetForm() {
    this.editingId.set(null);
    this.editingFileUrl.set('');
    this.formClassName = '';
    this.formCourseId = null;
    this.title = '';
    this.resourceType = 'TEXT';
    this.contentBody = '';
    this.fileName = '';
    this.fileUrl = '';
    this.selectedFile = null;
  }

  selectFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile = null;
    if (!file) return;
    const validation = validateUploadFile(file);
    if (validation) { this.error.set(validation); return; }
    this.fileName = file.name;
    this.selectedFile = file;
    this.error.set('');
  }

  saveResource() {
    const courseId = this.formCourseId;
    if (!courseId || !this.coursesInClass(this.formClassName).some(course => course.id === courseId) || this.saving()) {
      this.error.set('Choisissez une classe et un cours de destination.');
      return;
    }
    if (this.resourceType === 'FILE' && !this.selectedFile
      && !(this.editingId() && this.editingFileUrl() && this.fileUrl === this.editingFileUrl())) {
      this.error.set('Choisissez un fichier avant de publier.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const persist = (fileName: string, fileUrl: string) => {
      const body = {
        title: this.title, resourceType: this.resourceType,
        contentBody: this.resourceType === 'TEXT' ? this.contentBody : '',
        fileName: this.resourceType === 'FILE' ? fileName : this.title,
        fileUrl: this.resourceType === 'TEXT' ? '' : fileUrl
      };
      const edit = this.editingId();
      const request = edit ? this.api.updateResource(edit, body) : this.api.createResource(courseId, body);
      request.subscribe({
        next: () => {
          this.notice.set(edit ? 'Contenu mis à jour.' : 'Contenu publié dans le cours sélectionné.');
          if (!edit) {
            this.selectedClassName.set(this.formClassName);
            this.selectedCourseId.set(courseId);
          }
          this.closeForm();
          this.loadResources(courseId);
        },
        error: () => { this.error.set('La publication a échoué. Vérifiez le contenu et réessayez.'); this.saving.set(false); },
        complete: () => this.saving.set(false)
      });
    };
    if (this.resourceType === 'FILE' && this.selectedFile) {
      this.api.uploadFile(this.selectedFile).subscribe({
        next: file => { this.fileName = file.fileName; this.fileUrl = file.url; persist(file.fileName, file.url); },
        error: () => { this.error.set('Le téléversement a échoué. Vérifiez le type et la taille du fichier.'); this.saving.set(false); }
      });
    } else {
      persist(this.fileName || this.title, this.fileUrl);
    }
  }

  deleteResource(resource: TeacherResource) {
    if (!window.confirm(`Supprimer « ${resource.title} » ?`)) return;
    this.api.deleteResource(resource.id).subscribe({
      next: () => { this.notice.set('Contenu supprimé.'); this.loadResources(resource.courseId); },
      error: () => this.error.set('Impossible de supprimer ce contenu.')
    });
  }

  iconFor(type: string) { return type === 'TEXT' ? '¶' : type === 'LINK' ? '↗' : '▧'; }
  typeLabel(type: string) { return type === 'TEXT' ? 'TEXTE' : type === 'LINK' ? 'LIEN' : 'FICHIER'; }
}
