import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeacherApiService, TeacherCourse, TeacherResource } from '../../../core/services/teacher-api.service';
import { validateUploadFile } from '../../../shared/validation/file-upload.validation';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page">
      <header class="page-head"><div><p class="eyebrow">CONTENU PÉDAGOGIQUE</p><h1>Mes cours</h1><p>Publiez et maintenez à jour les ressources de vos cours.</p></div></header>
      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
      @if (loadingCourses()) { <p class="loading" role="status">Chargement des cours…</p> }
      @else if (!courses().length) {
        <section class="empty"><span aria-hidden="true">▤</span><h2>Aucun cours n’est affecté à votre compte</h2><p>Vos cours apparaîtront ici dès qu’ils vous seront assignés.</p></section>
      } @else {
        <section class="workbench">
          <aside class="course-list" aria-label="Liste des cours">
            <label for="course">Cours à gérer</label>
            <select id="course" [ngModel]="selectedCourseId()" (ngModelChange)="selectCourse($event)">
              @for (course of courses(); track course.id) { <option [ngValue]="course.id">{{ course.title }} · {{ course.code }}</option> }
            </select>
            @if (selectedCourse(); as course) {
              <div class="course-note"><span class="code">{{ course.code }}</span><h2>{{ course.title }}</h2><p>{{ course.className || 'Classe non précisée' }}</p></div>
            }
            <button type="button" class="primary" (click)="newResource()">＋ Ajouter un contenu</button>
          </aside>
          <section class="content" aria-label="Contenus du cours">
            @if (formOpen()) {
              <form class="editor" (ngSubmit)="saveResource()">
                <div class="editor-head"><div><p class="eyebrow">{{ editingId() ? 'MISE À JOUR' : 'NOUVELLE PUBLICATION' }}</p><h2>{{ editingId() ? 'Modifier le contenu' : 'Ajouter au cours' }}</h2></div><button class="close" type="button" aria-label="Fermer le formulaire" (click)="closeForm()">×</button></div>
                <label>Titre<input name="title" [(ngModel)]="title" maxlength="200" required /></label>
                <label>Type de contenu<select name="resourceType" [(ngModel)]="resourceType"><option value="TEXT">Texte de cours</option><option value="LINK">Lien externe</option><option value="FILE">Fichier déjà téléversé</option></select></label>
                @if (resourceType === 'TEXT') {
                  <label>Contenu<textarea name="contentBody" [(ngModel)]="contentBody" rows="6" maxlength="20000" required></textarea></label>
                } @else {
                  @if (resourceType === 'FILE') { <label>Fichier (PDF, DOCX, PPTX, JPG ou PNG · 10 MiB max)<input name="file" type="file" accept=".pdf,.docx,.pptx,.jpg,.png" (change)="selectFile($event)" /></label>@if (fileName) { <small class="hint">Fichier : {{ fileName }}</small> } }
                  @if (resourceType === 'LINK') { <label>Adresse du lien<input name="fileUrl" type="url" [(ngModel)]="fileUrl" maxlength="500" placeholder="https://…" required /></label> }
                }
                <div class="actions"><button class="primary" type="submit" [disabled]="saving()">{{ saving() ? 'Publication…' : (editingId() ? 'Enregistrer' : 'Publier') }}</button><button type="button" class="secondary" (click)="closeForm()">Annuler</button></div>
              </form>
            }
            <div class="list-head"><div><p class="eyebrow">RESSOURCES PUBLIÉES</p><h2>Contenu du cours</h2></div><span class="count">{{ resources().length }}</span></div>
            @if (loadingResources()) { <p class="loading" role="status">Chargement du contenu…</p> }
            @else if (!resources().length) { <div class="empty compact"><span aria-hidden="true">✧</span><h3>Le cours commence ici</h3><p>Publiez un premier support, une consigne ou un lien utile.</p></div> }
            @for (resource of resources(); track resource.id) {
              <article class="resource">
                <div class="resource-mark" [class]="resource.resourceType.toLowerCase()">{{ iconFor(resource.resourceType) }}</div>
                <div class="resource-main"><div class="title-row"><h3>{{ resource.title }}</h3><span class="type">{{ typeLabel(resource.resourceType) }}</span></div>
                  @if (resource.resourceType === 'TEXT') { <p class="body">{{ resource.contentBody }}</p> }
                  @if (resource.resourceType !== 'TEXT') { <a class="file-link" [href]="resource.fileUrl" target="_blank" rel="noopener noreferrer">{{ resource.fileName || resource.fileUrl }} ↗</a> }
                  <small>Publié le {{ resource.publishedAt | date:'d MMM y · HH:mm' }}@if (resource.updatedAt) { <span> · Modifié le {{ resource.updatedAt | date:'d MMM y · HH:mm' }}</span> }</small>
                </div>
                <div class="resource-actions"><button type="button" (click)="editResource(resource)">Modifier</button><button type="button" class="delete" (click)="deleteResource(resource)">Supprimer</button></div>
              </article>
            }
          </section>
        </section>
      }
    </div>
  `,
  styles: [`
    :host{display:block;max-width:1220px;margin:auto;color:#292a4d}*{box-sizing:border-box}.page{display:grid;gap:17px}.page-head{display:flex;align-items:flex-end;justify-content:space-between}.eyebrow{margin:0 0 7px;color:#7771b4;font-size:.67rem;font-weight:850;letter-spacing:.13em}h1{margin:0;font-size:2rem;letter-spacing:-.05em}.page-head p:last-child{margin:7px 0 0;color:#77758d;font-size:.88rem}.workbench{display:grid;grid-template-columns:265px minmax(0,1fr);gap:14px;align-items:start}.course-list,.content{min-width:0;border:1px solid #e8e7f2;border-radius:16px;background:#fff;box-shadow:0 4px 14px rgb(48 43 112 / 3%)}.course-list{position:sticky;top:18px;padding:17px}.course-list>label,.editor label{display:grid;gap:6px;color:#4b4967;font-size:.76rem;font-weight:750}.course-list select,.editor input,.editor select,.editor textarea{width:100%;min-width:0;padding:10px 11px;border:1px solid #dedde9;border-radius:9px;color:#33324f;background:#fff;font:inherit;font-size:.83rem}.course-note{margin:17px 0;padding:16px 0;border-top:1px solid #efedf5;border-bottom:1px solid #efedf5}.code{color:#7771b4;font-size:.7rem;font-weight:800;letter-spacing:.08em}.course-note h2{margin:5px 0;font-size:1.04rem}.course-note p{margin:0;color:#8a889a;font-size:.77rem}.primary,.secondary{padding:10px 13px;border:0;border-radius:9px;font:inherit;font-size:.78rem;font-weight:750;cursor:pointer}.primary{color:white;background:#393575}.primary:hover{background:#2c2a61}.primary:disabled{opacity:.55;cursor:wait}.course-list>.primary{width:100%}.secondary{color:#514e76;background:#f0eff8}.content{padding:19px}.list-head,.editor-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.list-head{margin-bottom:5px}.list-head h2,.editor-head h2{margin:0;font-size:1.12rem}.count{display:grid;width:29px;height:29px;place-items:center;border-radius:9px;color:#655ca9;background:#f0effb;font-size:.75rem;font-weight:800}.editor{display:grid;gap:12px;margin-bottom:20px;padding:16px;border:1px solid #dcd9f1;border-radius:13px;background:#faf9ff}.editor-head{margin-bottom:2px}.close{width:33px;height:33px;border:0;border-radius:8px;color:#625b99;background:#efedf9;font-size:1.25rem;cursor:pointer}.editor textarea{resize:vertical}.hint{margin-top:-6px;color:#8a6b3b;font-size:.72rem}.actions{display:flex;gap:8px}.resource{display:flex;gap:13px;align-items:flex-start;padding:15px 0;border-top:1px solid #efedf5}.resource-mark{display:grid;width:36px;height:36px;flex:0 0 auto;place-items:center;border-radius:10px;color:#665da8;background:#f0effb}.resource-mark.link{color:#34765a;background:#edf7f0}.resource-mark.file{color:#98612e;background:#fff4e8}.resource-main{min-width:0;flex:1}.title-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.resource h3{margin:0;font-size:.89rem}.type{padding:3px 7px;border-radius:20px;color:#7771b4;background:#f4f2fc;font-size:.62rem;font-weight:800}.body{max-width:850px;margin:7px 0;color:#68667c;font-size:.79rem;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}.file-link{display:block;margin:7px 0;color:#514b91;font-size:.78rem;overflow-wrap:anywhere}.resource-main small{display:block;margin-top:8px;color:#9491a2;font-size:.68rem}.resource-actions{display:flex;gap:5px}.resource-actions button{padding:7px 8px;border:1px solid #e4e2ed;border-radius:8px;color:#5d588d;background:#fff;font:inherit;font-size:.7rem;font-weight:700;cursor:pointer}.resource-actions .delete{color:#a24542}.empty{padding:36px 20px;border:1px dashed #dedced;border-radius:16px;color:#77758d;background:#fff;text-align:center}.empty>span{color:#8981d0;font-size:1.8rem}.empty h2,.empty h3{margin:8px 0;color:#454361;font-size:1rem}.empty p{margin:0;font-size:.81rem}.empty.compact{margin-top:12px;padding:30px 15px}.loading{margin:0;color:#77758d;font-size:.8rem}.alert,.notice{margin:0;padding:11px;border-radius:10px;font-size:.82rem}.alert{color:#9b3836;background:#fff0ef}.notice{color:#276b49;background:#edf8f1}@media(max-width:850px){.workbench{grid-template-columns:220px minmax(0,1fr)}.resource{flex-wrap:wrap}.resource-actions{margin-left:48px}}@media(max-width:680px){.workbench{grid-template-columns:1fr}.course-list{position:static}.content{padding:14px}.page-head{align-items:flex-start}.resource{gap:9px}.resource-actions{width:100%;margin-left:45px}.resource-actions button{flex:1}.editor{padding:13px}}@media(max-width:380px){.resource-mark{width:30px;height:30px}.resource-main{flex-basis:calc(100% - 44px)}}
  `]
})
export class TeacherCoursesComponent implements OnInit {
  private readonly api = inject(TeacherApiService);
  readonly courses = signal<TeacherCourse[]>([]);
  readonly resources = signal<TeacherResource[]>([]);
  readonly selectedCourseId = signal<number | null>(null);
  readonly loadingCourses = signal(true);
  readonly loadingResources = signal(false);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  title = '';
  resourceType: 'TEXT' | 'LINK' | 'FILE' = 'TEXT';
  contentBody = '';
  fileName = '';
  fileUrl = '';
  selectedFile: File | null = null;

  ngOnInit() {
    this.api.courses().subscribe({
      next: values => {
        this.courses.set(values);
        this.loadingCourses.set(false);
        if (values.length) {
          this.selectedCourseId.set(values[0].id);
          this.loadResources(values[0].id);
        }
      },
      error: () => { this.error.set('Impossible de charger vos cours.'); this.loadingCourses.set(false); }
    });
  }

  selectedCourse() { return this.courses().find(course => course.id === this.selectedCourseId()) ?? null; }
  selectCourse(id: number) {
    this.selectedCourseId.set(Number(id));
    this.resources.set([]);
    this.closeForm();
    this.loadResources(Number(id));
  }
  loadResources(id: number) {
    this.loadingResources.set(true);
    this.api.resources(id).subscribe({
      next: value => this.resources.set(value),
      error: () => { this.error.set('Impossible de charger le contenu de ce cours.'); this.loadingResources.set(false); },
      complete: () => this.loadingResources.set(false)
    });
  }
  newResource() { this.resetForm(); this.formOpen.set(true); this.notice.set(''); }
  editResource(resource: TeacherResource) {
    this.editingId.set(resource.id);
    this.title = resource.title;
    this.resourceType = resource.resourceType;
    this.contentBody = resource.contentBody ?? '';
    this.fileName = resource.fileName ?? '';
    this.fileUrl = resource.fileUrl ?? '';
    this.formOpen.set(true);
    this.notice.set('');
  }
  closeForm() { this.formOpen.set(false); this.resetForm(); }
  private resetForm() {
    this.editingId.set(null); this.title = ''; this.resourceType = 'TEXT';
    this.contentBody = ''; this.fileName = ''; this.fileUrl = ''; this.selectedFile = null;
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
    const courseId = this.selectedCourseId();
    if (!courseId || this.saving()) return;
    if (this.resourceType === 'FILE' && !this.selectedFile && !this.fileUrl) {
      this.error.set('Choisissez un fichier avant de publier.'); return;
    }
    this.saving.set(true); this.error.set('');
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
      next: () => { this.notice.set(edit ? 'Contenu mis à jour.' : 'Contenu publié.'); this.closeForm(); this.loadResources(courseId); },
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
