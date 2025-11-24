import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/api/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ToastContainer } from '../../../shared/ui/toast/toast-container';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ToastContainer]
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  loading = false;
  token: string | null = null;
  tokenValid = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get password(): FormControl { return this.form.get('password') as FormControl; }
  get confirmPassword(): FormControl { return this.form.get('confirmPassword') as FormControl; }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (!this.token) {
        this.tokenValid = false;
        this.toast.error('Lien de réinitialisation invalide.');
        return;
      }

      this.auth.verifyResetToken(this.token).subscribe({
        next: (res) => {
          if (!(res as any)?.success) {
            this.tokenValid = false;
            this.toast.error((res as any)?.message || 'Token invalide ou expiré.');
          }
        },
        error: (err) => {
          this.tokenValid = false;
          const message = err?.error?.message || 'Token invalide ou expiré.';
          this.toast.error(message);
        }
      });
    });
  }

  onSubmit(): void {
    if (!this.token || !this.tokenValid) {
      this.toast.error('Lien de réinitialisation invalide ou expiré.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    this.loading = true;
    this.auth.resetPassword(this.token, password, confirmPassword).subscribe({
      next: (res) => {
        const message = (res as any)?.message || 'Mot de passe réinitialisé avec succès.';
        this.toast.success(message);
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        const message = err?.error?.message || 'Impossible de réinitialiser le mot de passe.';
        this.toast.error(message);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
