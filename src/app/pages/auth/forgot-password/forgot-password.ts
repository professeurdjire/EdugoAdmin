import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/api/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ToastContainer } from '../../../shared/ui/toast/toast-container';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ToastContainer]
})
export class ForgotPassword {
  form: FormGroup;
  loading = false;
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email(): FormControl { return this.form.get('email') as FormControl; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { email } = this.form.value;
    this.auth.requestPasswordReset(email).subscribe({
      next: (res) => {
        this.emailSent = true;
        const message = (res as any)?.message || "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.";
        this.toast.success(message);
      },
      error: (err) => {
        const message = err?.error?.message || "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.";
        this.toast.info(message);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
