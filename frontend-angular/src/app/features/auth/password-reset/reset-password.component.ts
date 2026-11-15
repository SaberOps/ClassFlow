import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PasswordResetService } from './password-reset.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './password-reset.component.scss',
})
export class ResetPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly passwordReset = inject(PasswordResetService);
  protected readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  protected readonly form = this.formBuilder.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required],
  });
  protected loading = false;
  protected message = '';
  protected errorMessage = this.token ? '' : 'This password reset link is invalid.';

  protected submit(): void {
    this.message = '';
    this.errorMessage = '';
    if (!this.token) {
      this.errorMessage = 'This password reset link is invalid.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.errorMessage = 'The passwords do not match.';
      return;
    }

    this.loading = true;
    this.passwordReset.resetPassword(this.token, newPassword).subscribe({
      next: (response) => {
        this.message = response.message;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.loading = false;
      },
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message;
      if (typeof message === 'string') return message;
      if (error.status === 0) return 'The server could not be reached. Please try again later.';
    }
    return 'The reset link is invalid or has expired.';
  }
}
