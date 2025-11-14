import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/api/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ToastContainer } from '../../../shared/ui/toast/toast-container';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ToastContainer
  ],
  styleUrls: ['./login.css']
})
export class Login {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Typed accessors for template to satisfy Angular's strict type-checker
  get email(): FormControl { return this.loginForm.get('email') as FormControl; }
  get password(): FormControl { return this.loginForm.get('password') as FormControl; }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;
    this.auth.login(email, password).subscribe({
      next: () => {
        this.toast.success('Connexion réussie');
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        const message = err?.error?.message || 'Échec de la connexion. Vérifiez vos identifiants.';
        this.toast.error(message);
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}
