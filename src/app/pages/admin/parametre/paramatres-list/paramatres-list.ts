import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../services/api/auth.service';

@Component({
  selector: 'app-paramatres-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paramatres-list.html',
  styleUrls: ['./paramatres-list.css']
})
export class ParamatresList implements OnInit {
  error: string | null = null;
  isLoading = false;
  isSaving = false;
  settingsForm: FormGroup;

  // Données pour les sélecteurs
  timezones = [
    { value: 'UTC+0', label: 'UTC +0 (GMT)' },
    { value: 'UTC+1', label: 'UTC +1 (Afrique de l\'Ouest)', selected: true },
    { value: 'UTC+2', label: 'UTC +2 (Afrique centrale)' }
  ];

  languages = [
    { value: 'fr', label: 'Français', selected: true },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'ar', label: 'العربية' }
  ];

  currencies = [
    { value: 'XOF', label: 'Franc CFA (XOF)', selected: true },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dollar US (USD)' }
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    // Initialisation du formulaire réactif
    this.settingsForm = this.fb.group({
      platformName: ['EDUGO Mali', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      platformUrl: ['edugo.ml', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.-]+$/)]],
      description: [
        'EDUGO - Bibliothèque digitale innovante pour les élèves du Mali, offrant un accès équitable à l\'éducation grâce à des ressources pédagogiques numériques de qualité.',
        [Validators.maxLength(500)]
      ],
      contactEmail: [
        'professeurhamidoudjire@gmail.com', 
        [Validators.required, Validators.email]
      ],
      supportPhone: [
        '+223 74469970',
        [Validators.pattern(/^\+?[0-9\s\-\(\)]{8,}$/)]
      ],
      timezone: ['UTC+1', [Validators.required]],
      defaultLanguage: ['fr', [Validators.required]],
      currency: ['XOF', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Vérification de l'authentification
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }

    // Chargement des paramètres existants
    this.loadSettings();
  }

  /**
   * Charge les paramètres depuis l'API ou les valeurs par défaut
   */
  loadSettings(): void {
    this.isLoading = true;
    
    // Simulation du chargement des paramètres depuis une API
    setTimeout(() => {
      // Ici, vous intégreriez l'appel à votre service API
      // this.settingsService.getSettings().subscribe({
      //   next: (settings) => {
      //     this.settingsForm.patchValue(settings);
      //     this.isLoading = false;
      //   },
      //   error: (error) => {
      //     console.error('Erreur lors du chargement des paramètres:', error);
      //     this.error = 'Impossible de charger les paramètres. Utilisation des valeurs par défaut.';
      //     this.isLoading = false;
      //   }
      // });
      
      // Pour l'instant, on utilise les valeurs par défaut du formulaire
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.markFormGroupTouched(this.settingsForm);

    if (this.settingsForm.valid && !this.isSaving) {
      this.isSaving = true;
      
      // Simulation de l'enregistrement
      setTimeout(() => {
        console.log('Paramètres sauvegardés:', this.settingsForm.value);
        
        // Ici, vous intégreriez l'appel à votre service API
        // this.settingsService.updateSettings(this.settingsForm.value).subscribe({
        //   next: (response) => {
        //     this.isSaving = false;
        //     this.showSuccessMessage('Paramètres sauvegardés avec succès!');
        //   },
        //   error: (error) => {
        //     console.error('Erreur lors de la sauvegarde:', error);
        //     this.isSaving = false;
        //     this.showErrorMessage('Erreur lors de la sauvegarde des paramètres.');
        //   }
        // });
        
        // Simulation de succès
        this.isSaving = false;
        this.showSuccessMessage('Paramètres sauvegardés avec succès!');
        
      }, 1500);
    } else {
      this.showErrorMessage('Veuillez corriger les erreurs dans le formulaire.');
    }
  }

  /**
   * Annulation des modifications
   */
  onCancel(): void {
    if (this.settingsForm.dirty) {
      const confirmReset = confirm('Voulez-vous vraiment annuler les modifications ? Les changements non sauvegardés seront perdus.');
      if (confirmReset) {
        this.resetForm();
      }
    }
  }

  /**
   * Réinitialisation du formulaire
   */
  resetForm(): void {
    this.settingsForm.reset({
      platformName: 'EDUGO Mali',
      platformUrl: 'edugo.ml',
      description: 'EDUGO - Bibliothèque digitale innovante pour les élèves du Mali, offrant un accès équitable à l\'éducation grâce à des ressources pédagogiques numériques de qualité.',
      contactEmail: 'professeurhamidoudjire@gmail.com',
      supportPhone: '+223 74469970',
      timezone: 'UTC+1',
      defaultLanguage: 'fr',
      currency: 'XOF'
    });
  }

  /**
   * Marque tous les champs du formulaire comme touchés pour afficher les erreurs de validation
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  /**
   * Affiche un message de succès
   */
  private showSuccessMessage(message: string): void {
    // Ici vous pourriez utiliser un service de notifications toast
    alert(message); // Temporaire - à remplacer par un système de notifications
    console.log('Succès:', message);
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(message: string): void {
    // Ici vous pourriez utiliser un service de notifications toast
    alert(message); // Temporaire - à remplacer par un système de notifications
    console.error('Erreur:', message);
  }

  /**
   * Getters pratiques pour l'accès aux contrôles du formulaire dans le template
   */
  get platformName() { return this.settingsForm.get('platformName'); }
  get platformUrl() { return this.settingsForm.get('platformUrl'); }
  get description() { return this.settingsForm.get('description'); }
  get contactEmail() { return this.settingsForm.get('contactEmail'); }
  get supportPhone() { return this.settingsForm.get('supportPhone'); }
  get timezone() { return this.settingsForm.get('timezone'); }
  get defaultLanguage() { return this.settingsForm.get('defaultLanguage'); }
  get currency() { return this.settingsForm.get('currency'); }

  /**
   * Vérifie si un champ est invalide et a été touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.settingsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Récupère le message d'erreur pour un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.settingsForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères requis`;
      }
      if (field.errors['maxlength']) {
        return `Maximum ${field.errors['maxlength'].requiredLength} caractères autorisés`;
      }
      if (field.errors['pattern']) {
        return 'Format invalide';
      }
    }
    
    return '';
  }
}