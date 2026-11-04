import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { AdminUserService, apiErrorMessage } from './admin-user.service';
import { UserEditDialogComponent } from './user-edit-dialog.component';
import { AdminUser, ROLE_LABELS, Role } from './user.model';

type StatusFilter = 'all' | 'active' | 'inactive';
type PendingAction = { kind: 'deactivate' | 'delete'; user: AdminUser };

@Component({
  selector: 'app-user-list',
  imports: [ReactiveFormsModule, ConfirmDialogComponent, UserEditDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly api = inject(AdminUserService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly pageSize = 10;

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly loading = signal(false);
  protected readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  protected readonly editing = signal<AdminUser | null>(null);
  protected readonly pending = signal<PendingAction | null>(null);
  protected readonly busy = signal(false);

  protected readonly filters = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    role: new FormControl<Role | ''>('', { nonNullable: true }),
    status: new FormControl<StatusFilter>('all', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(0);
        this.load();
      });
  }

  protected load(): void {
    const { q, role, status } = this.filters.getRawValue();
    this.loading.set(true);
    this.api
      .list({
        q,
        role: role || undefined,
        enabled: status === 'all' ? undefined : status === 'active',
        page: this.page(),
        size: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.content);
          this.totalPages.set(res.totalPages);
          this.totalElements.set(res.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err);
        },
      });
  }

  protected goTo(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.page.set(page);
    this.load();
  }

  // ---- Modify ----------------------------------------------------------
  protected openEdit(user: AdminUser): void {
    this.editing.set(user);
  }

  protected onSaved(updated: AdminUser): void {
    this.editing.set(null);
    this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
    this.showSuccess('Account updated.');
  }

  // ---- Deactivate / reactivate ----------------------------------------
  protected toggleStatus(user: AdminUser): void {
    if (user.enabled) {
      this.pending.set({ kind: 'deactivate', user }); // ask first: it blocks the user's login
    } else {
      this.changeStatus(user, true); // reactivating is harmless, no confirmation needed
    }
  }

  private changeStatus(user: AdminUser, enabled: boolean): void {
    this.busy.set(true);
    this.api.setEnabled(user.id, enabled).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.pending.set(null);
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.showSuccess(enabled ? 'Account reactivated.' : 'Account deactivated. The user can no longer sign in.');
        if (this.filters.controls.status.value !== 'all') this.load(); // it may leave the filtered view
      },
      error: (err) => {
        this.busy.set(false);
        this.pending.set(null);
        this.showError(err);
      },
    });
  }

  // ---- Delete -----------------------------------------------------------
  protected askDelete(user: AdminUser): void {
    this.pending.set({ kind: 'delete', user });
  }

  protected confirmPending(): void {
    const action = this.pending();
    if (!action) return;
    if (action.kind === 'deactivate') {
      this.changeStatus(action.user, false);
      return;
    }
    this.busy.set(true);
    this.api.delete(action.user.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.pending.set(null);
        this.showSuccess('Account deleted.');
        // If it was the last row of the last page, go back one page.
        if (this.users().length === 1 && this.page() > 0) this.page.update((p) => p - 1);
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.pending.set(null);
        this.showError(err);
      },
    });
  }

  protected cancelPending(): void {
    if (!this.busy()) this.pending.set(null);
  }

  protected pendingTitle(): string {
    const a = this.pending();
    return a?.kind === 'delete' ? 'Delete this account?' : 'Deactivate this account?';
  }

  protected pendingMessage(): string {
    const a = this.pending();
    if (!a) return '';
    const name = `${a.user.firstName} ${a.user.lastName}`;
    return a.kind === 'delete'
      ? `${name} will no longer be able to sign in and will disappear from all lists. Their history (courses, attendance, grades) is kept.`
      : `${name} will no longer be able to sign in. Their history is kept, and you can reactivate the account at any time.`;
  }

  protected pendingLabel(): string {
    return this.pending()?.kind === 'delete' ? 'Delete account' : 'Deactivate';
  }

  // ---- Feedback ---------------------------------------------------------
  private showSuccess(text: string): void {
    this.message.set({ type: 'success', text });
  }

  private showError(err: unknown): void {
    this.message.set({ type: 'error', text: apiErrorMessage(err) });
  }

  protected dismissMessage(): void {
    this.message.set(null);
  }
}
