import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, homePathForRole } from '../auth/auth.service';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  styleUrls: ['./login.css', './login-logos.css', './login-visuals.css', './login-motion.css'],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  passwordVisible = false;
  isSubmitting = false;
  notice = '';

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.notice = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (user) => {
        this.password = '';
        void this.router.navigateByUrl(homePathForRole(user.role));
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.notice =
          error instanceof HttpErrorResponse && error.status === 401
            ? 'Adresse e-mail ou mot de passe invalide.'
            : 'La connexion est temporairement indisponible. Réessayez.';
      },
    });
  }
}
