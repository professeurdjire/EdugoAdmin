import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common'; // Pour simuler la navigation

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [
    CommonModule,        // ✅ indispensable
    FormsModule,         // si tu utilises [(ngModel)]
    ReactiveFormsModule, // si tu utilises formGroup, formControlName

  ],
  styleUrls: ['./login.css'] // Utilisation de CSS standard
})
export class Login implements OnInit {
  // Déclaration du FormGroup
  loginForm!: FormGroup;
  // État pour contrôler l'affichage du mot de passe (icône œil)
  hidePassword = true;

  // Injection de FormBuilder pour construire le formulaire
  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // Initialisation du formulaire avec validation
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Getter pour un accès facile et propre aux contrôles (f['email'])
  get f() { return this.loginForm.controls; }

  // Gestion de la soumission du formulaire
  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Afficher les erreurs si le formulaire est soumis invalide
      this.loginForm.markAllAsTouched();
      return;
    }

    // Logique d'authentification (service simulé)
    console.log('Tentative de connexion avec:', this.loginForm.value);

    // Simulation de la redirection après succès
    this.router.navigate(['/accueil']);
  }

  // Navigation vers la page de récupération de mot de passe
  onForgotPassword(): void {
    console.log('Navigue vers /mot-de-passe-oublie');
    this.router.navigate(['/auth/mot-de-passe-oublie']);
  }

  // Navigation vers la page d'inscription (Première étape)
  onRegister(): void {
    console.log('Navigue vers /inscription/etape-1');
    this.router.navigate(['/auth/inscription/etape-1']);
  }
}
