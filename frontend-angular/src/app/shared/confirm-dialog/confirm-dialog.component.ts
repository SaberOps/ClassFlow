import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

/**
 * Reusable confirmation dialog (no UI library needed).
 * Usage: <app-confirm-dialog title="..." message="..." confirmLabel="Delete" [danger]="true"
 *          [busy]="busy()" (confirmed)="..." (cancelled)="..." />
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="cancelled.emit()">
      <div
        class="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        (click)="$event.stopPropagation()"
      >
        <h2 id="confirm-title">{{ title() }}</h2>
        <p id="confirm-message">{{ message() }}</p>
        <div class="actions">
          <button type="button" class="btn" (click)="cancelled.emit()" [disabled]="busy()">Cancel</button>
          <button
            type="button"
            class="btn"
            [class.btn-danger]="danger()"
            [class.btn-primary]="!danger()"
            (click)="confirmed.emit()"
            [disabled]="busy()"
          >
            {{ busy() ? 'Please wait...' : confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: grid;
      place-items: center;
      z-index: 1000;
    }
    .dialog {
      background: #fff;
      color: #1f2937;
      border-radius: 10px;
      padding: 24px;
      width: min(440px, calc(100vw - 32px));
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
    }
    h2 { margin: 0 0 8px; font-size: 1.15rem; }
    p { margin: 0 0 20px; line-height: 1.5; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .btn {
      border: 1px solid #d1d5db; background: #fff; color: inherit;
      padding: 8px 14px; border-radius: 6px; cursor: pointer; font: inherit;
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
    .btn-danger { background: #dc2626; border-color: #dc2626; color: #fff; }
  `,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly danger = input(false);
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.busy()) this.cancelled.emit();
  }
}
