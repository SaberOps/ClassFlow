import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, input, output, signal } from '@angular/core';

import { AdminUserService, apiErrorMessage } from './admin-user.service';
import { AdminUserProfile, ROLE_LABELS } from './user.model';

@Component({
  selector: 'app-user-profile-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="closed.emit()">
      <section
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        (click)="$event.stopPropagation()"
      >
        <header>
          <div>
            <p class="eyebrow">ACCOUNT DETAILS</p>
            <h2 id="profile-title">User profile</h2>
          </div>
          <button type="button" class="close" (click)="closed.emit()" aria-label="Close profile">&times;</button>
        </header>

        @if (loading()) {
          <p role="status">Loading profile…</p>
        } @else if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        } @else {
          @if (profile(); as user) {
            <div class="identity">
              @if (user.photoUrl) {
                <img [src]="user.photoUrl" [alt]="user.firstName + ' ' + user.lastName" referrerpolicy="no-referrer" />
              } @else {
                <span class="avatar" aria-hidden="true">{{ user.firstName[0] }}{{ user.lastName[0] }}</span>
              }
              <div>
                <h3>{{ user.firstName }} {{ user.lastName }}</h3>
                <p>{{ roleLabels[user.role] }} · {{ user.enabled ? 'Active' : 'Deactivated' }}</p>
              </div>
            </div>

            <dl>
              <div><dt>Email</dt><dd>{{ user.email }}</dd></div>
              <div><dt>Phone</dt><dd>{{ user.phone || '—' }}</dd></div>
              @if (user.role === 'STUDENT') {
                <div><dt>Student number</dt><dd>{{ user.studentNumber || '—' }}</dd></div>
                <div><dt>Department</dt><dd>{{ user.departmentName || '—' }}</dd></div>
                <div><dt>Class</dt><dd>{{ user.className || '—' }}</dd></div>
              }
              @if (user.role === 'TEACHER') {
                <div class="wide">
                  <dt>Subjects</dt>
                  <dd>{{ user.subjects.length ? user.subjects.join(', ') : '—' }}</dd>
                </div>
              }
              @if (user.courses.length) {
                <div class="wide">
                  <dt>Courses</dt>
                  <dd>{{ user.courses.join(', ') }}</dd>
                </div>
              }
              <div class="wide">
                <dt>Temporary password change</dt>
                <dd>{{ user.mustChangePassword ? 'Required at next sign-in' : 'Not required' }}</dd>
              </div>
            </dl>

            @if (user.photoUrl) {
              <a class="photo-link" [href]="user.photoUrl" target="_blank" rel="noopener noreferrer">Open profile photo</a>
            }
          }
        }

        <footer>
          <button type="button" class="primary" (click)="closed.emit()">Close</button>
        </footer>
      </section>
    </div>
  `,
  styles: `
    :host { color: #292a4d; }
    .backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 16px; background: rgb(25 24 54 / 48%); }
    .dialog { width: min(620px, 100%); max-height: min(760px, 90vh); overflow: auto; padding: 24px; border: 1px solid #e8e7f2; border-radius: 16px; background: #fff; box-shadow: 0 20px 60px rgb(25 24 54 / 22%); }
    header, footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .eyebrow { margin: 0 0 4px; color: #7771b4; font-size: .68rem; font-weight: 800; letter-spacing: .12em; }
    h2, h3, p { margin: 0; }
    h2 { font-size: 1.25rem; }
    .close { border: 0; background: transparent; color: #706b8e; font-size: 1.7rem; cursor: pointer; }
    .identity { display: flex; align-items: center; gap: 14px; margin: 22px 0; }
    .identity img, .avatar { width: 58px; height: 58px; flex: 0 0 auto; border-radius: 50%; object-fit: cover; }
    .avatar { display: grid; place-items: center; color: #fff; background: #393575; font-weight: 800; }
    .identity h3 { font-size: 1.05rem; }
    .identity p { margin-top: 5px; color: #77758d; font-size: .85rem; }
    dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
    dl div { min-width: 0; padding: 12px; border: 1px solid #eeedf5; border-radius: 10px; background: #faf9fd; }
    dl .wide { grid-column: 1 / -1; }
    dt { color: #77758d; font-size: .72rem; font-weight: 700; }
    dd { overflow-wrap: anywhere; margin: 4px 0 0; font-size: .88rem; }
    .photo-link { display: inline-block; margin-top: 14px; color: #514a9b; font-size: .82rem; }
    .error { margin-top: 20px; color: #a53d3d; }
    footer { justify-content: flex-end; margin-top: 20px; }
    .primary { padding: 9px 16px; border: 0; border-radius: 8px; color: #fff; background: #393575; font: inherit; cursor: pointer; }
    button:focus-visible, a:focus-visible { outline: 3px solid #cbc6f0; outline-offset: 3px; }
    @media (max-width: 480px) { .dialog { padding: 18px; } dl { grid-template-columns: 1fr; } dl .wide { grid-column: auto; } }
  `,
})
export class UserProfileDialogComponent implements OnInit {
  private readonly api = inject(AdminUserService);

  readonly userId = input.required<number>();
  readonly closed = output<void>();
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly profile = signal<AdminUserProfile | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.profile(this.userId()).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }
}
