import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { AuthService, homePathForRole } from '../auth/auth.service';

const QUOTE_ROTATION_INTERVAL_MS = 12_000;

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  styleUrls: ['./login.css', './login-logos.css', './login-visuals.css', './login-motion.css'],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly quotes = [
    'Chaque question ouvre un chemin vers une nouvelle découverte.',
    'Un petit pas appris aujourd’hui peut mener loin demain.',
    'La curiosité transforme chaque cours en occasion d’avancer.',
    'En partageant nos idées, nous faisons grandir nos connaissances.',
  ];
  private quoteIndex = 0;

  email = '';
  password = '';
  passwordVisible = false;
  isSubmitting = false;
  notice = '';
  currentQuote = '';

  ngOnInit(): void {
    this.quoteIndex = Math.floor(Math.random() * this.quotes.length);
    this.currentQuote = this.quotes[this.quoteIndex];

    if (typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    interval(QUOTE_ROTATION_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.quoteIndex = (this.quoteIndex + 1) % this.quotes.length;
        this.currentQuote = this.quotes[this.quoteIndex];
      });
  }

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
        const passwordChangePath = user.role === 'STUDENT'
          ? '/student/change-password'
          : '/teacher/change-password';
        void this.router.navigateByUrl(
          user.mustChangePassword && user.role !== 'ADMIN'
            ? passwordChangePath
            : homePathForRole(user.role));
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
