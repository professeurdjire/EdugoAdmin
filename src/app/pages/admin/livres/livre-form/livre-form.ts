import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-livre-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './livre-form.html',
  styleUrls: ['./livre-form.css']
})
export class LivreForm {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef;

  livreForm: FormGroup;
  isSubmitting = false;

  // Données pour les sélecteurs
  matieres = [
    { value: 'mathematiques', label: 'Mathématiques' },
    { value: 'physique', label: 'Physique' },
    { value: 'chimie', label: 'Chimie' },
    { value: 'francais', label: 'Français' },
    { value: 'histoire', label: 'Histoire' }
  ];

  niveaux = [
    { value: '4eme', label: '4ème' },
    { value: '3eme', label: '3ème' },
    { value: '2nde', label: '2nde' },
    { value: '1ere', label: '1ère' },
    { value: 'terminale', label: 'Terminale' }
  ];

  langues = [
    { value: 'francais', label: 'Français' },
    { value: 'anglais', label: 'Anglais' },
    { value: 'espagnol', label: 'Espagnol' }
  ];

  annees = [
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' },
    { value: '2020', label: '2020' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.livreForm = this.createForm();
  }

  createForm(): FormGroup {
    return this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      auteur: ['', [Validators.required]],
      isbn: [''],
      editeur: [''],
      description: ['', [Validators.maxLength(500)]],
      matiere: ['', [Validators.required]],
      niveau: ['', [Validators.required]],
      langue: ['francais'],
      fichierPrincipal: [null, [Validators.required]],
      imageCouverture: [null],
      lectureAuto: [false],
      interactif: [false],
      telechargementHorsLigne: [false],
      motsCles: [''],
      anneePublication: ['2024']
    });
  }

  onRetour() {
    this.router.navigate(['/admin/livreList']);
  }

  onAnnuler() {
    if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
      this.livreForm.reset({
        langue: 'francais',
        anneePublication: '2024',
        lectureAuto: false,
        interactif: false,
        telechargementHorsLigne: false
      });
    }
  }

  onSubmit() {
    this.markFormGroupTouched(this.livreForm);

    if (this.livreForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      // Simulation d'enregistrement
      setTimeout(() => {
        console.log('Livre sauvegardé:', this.livreForm.value);
        this.isSubmitting = false;
        this.router.navigate(['/admin/livreList']);
      }, 1500);
    } else {
      alert('Veuillez corriger les erreurs dans le formulaire.');
    }
  }

  onFileSelected(event: any, type: 'file' | 'image') {
    const file = event.target.files[0];
    if (file) {
      // Validation de la taille
      const maxSize = type === 'file' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB ou 10MB
      
      if (file.size > maxSize) {
        alert(`Le fichier est trop volumineux. Taille max: ${type === 'file' ? '50MB' : '10MB'}`);
        return;
      }

      if (type === 'file') {
        this.livreForm.patchValue({ fichierPrincipal: file });
      } else {
        this.livreForm.patchValue({ imageCouverture: file });
      }
      
      console.log(`${type === 'file' ? 'Fichier' : 'Image'} sélectionné:`, file.name);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: 'file' | 'image') {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Créer un événement de changement de fichier simulé
      const changeEvent = {
        target: {
          files: [file]
        }
      };
      
      this.onFileSelected(changeEvent, type);
    }
  }

  // Méthodes utilitaires pour le template
  showError(fieldName: string): boolean {
    const field = this.livreForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getError(fieldName: string): string {
    const field = this.livreForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['maxlength']) {
        return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
      }
    }
    
    return '';
  }

  get description() {
    return this.livreForm.get('description');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}