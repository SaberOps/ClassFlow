import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-login',
  styleUrls: ['./login.css', './login-logos.css', './login-visuals.css', './login-motion.css'],
  templateUrl: './login.html',
})
export class Login {
  passwordVisible = false;
  notice = '';

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.notice = 'La connexion n’est pas encore activée. Contactez votre administrateur.';
  }
}
