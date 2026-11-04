import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminUserService, apiErrorMessage } from './admin-user.service';
import { AdminUser, ROLE_LABELS } from './user.model';

/** Edit dialog for US11 "Modification des champs". The role is shown but not editable. */
@Component({
  selector: 'app-user-edit-dialog',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="cancelled.emit()">
      <form
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        [formGroup]="form"
        (ngSubmit)="save()"
        (click)="$event.stopPropagation()"
      >
        <h2 id="edit-title">Edit account</h2>
        <p class="role">Role: <strong>{{ roleLabel() }}</strong> (cannot be changed here)</p>

        <label>
          First name
          <input formControlName="firstName" autocomplete="off" />
          @if (invalid('firstName')) { <small class="err">First name is required.</small> }
        </label>

        <label>
          Last name
          <input formControlName="lastName" autocomplete="off" />
          @if (invalid('lastName')) { <small class="err">Last name is required.</small> }
        </label>

        <label>
          Institutional email
          <input type="email" formControlName="email" autocomplete="off" />
          @if (invalid('email')) { <small class="err">Enter a valid email address.</small> }
        </label>

        @if (error()) { <div class="alert" role="alert">{{ error() }}</div> }

        <div class="actions">
          <button type="button" class="btn" (click)="cancelled.emit()" [disabled]="saving()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: grid; place-items: center; z-index: 1000; }
    .dialog { background: #fff; color: #1f2937; border-radius: 10px; padding: 24px; width: min(480px, calc(100vw - 32px));
      box-shadow: 0 10px 40px rgba(0,0,0,.25); display: grid; gap: 14px; }
    h2 { margin: 0; font-size: 1.15rem; }
    .role { margin: 0; color: #6b7280; font-size: .9rem; }
    label { display: grid; gap: 4px; font-size: .9rem; font-weight: 600; }
    input { font: inherit; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-weight: 400; }
    input:focus { outline: 2px solid #2563eb; outline-offset: 1px; }
    .err { color: #b91c1c; font-weight: 400; }
    .alert { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 10px; font-size: .9rem; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
    .btn { border: 1px solid #d1d5db; background: #fff; color: inherit; padding: 8px 14px; border-radius: 6px; cursor: pointer; font: inherit; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
  `,
})
export class UserEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(AdminUserService);

  readonly user = input.required<AdminUser>();
  readonly saved = output<AdminUser>();
  readonly cancelled = output<void>();

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    const u = this.user();
    this.form.reset({ firstName: u.firstName, lastName: u.lastName, email: u.email });
  }

  protected roleLabel(): string {
    return ROLE_LABELS[this.user().role];
  }

  protected invalid(name: 'firstName' | 'lastName' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.saving()) this.cancelled.emit();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.update(this.user().id, this.form.getRawValue()).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.saved.emit(updated);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
