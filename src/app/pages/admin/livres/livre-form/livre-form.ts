import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LivresService } from '../../../../services/api/admin/livres.service';
import { MatieresService } from '../../../../services/api/admin/matieres.service';
import { NiveauxService } from '../../../../services/api/admin/niveaux.service';
import { LanguesService } from '../../../../services/api/admin/langues.service';
import { Livre } from '../../../../api/model/livre';
import { Matiere } from '../../../../api/model/matiere';
import { Niveau } from '../../../../api/model/niveau';
import { Langue } from '../../../../api/model/langue'; // NOUVEAU MODÈLE

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
  isEditMode = false;
  livreId: number | null = null;
  loading = false;

  // Données pour les sélecteurs
  matieres: Matiere[] = [];
  niveaux: Niveau[] = [];
  langues: Langue[] = []; // MAINTENANT chargé depuis l'API
  annees = [
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' },
    { value: '2020', label: '2020' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private livresService: LivresService,
    private matieresService: MatieresService,
    private niveauxService: NiveauxService,
    private languesService: LanguesService // NOUVEAU SERVICE INJECTÉ
  ) {
    this.livreForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.checkEditMode();
  }

  checkEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.livreId = +params['id'];
        this.loadLivreData(this.livreId);
      }
    });
  }

  loadReferenceData(): void {
    this.loading = true;

    // Charger les matières
    this.matieresService.list().subscribe({
      next: (matieres: Matiere[]) => {
        this.matieres = matieres;
      },
      error: (err) => {
        console.error('Erreur chargement matières:', err);
        this.matieres = [];
      }
    });

    // Charger les niveaux
    this.niveauxService.list().subscribe({
      next: (niveaux: Niveau[]) => {
        this.niveaux = niveaux;
      },
      error: (err) => {
        console.error('Erreur chargement niveaux:', err);
        this.niveaux = [];
      }
    });

    // CHARGER LES LANGUES DEPUIS L'API
    this.languesService.list().subscribe({
      next: (langues: Langue[]) => {
        this.langues = langues;
        this.loading = false;
        
        // Si pas de langues chargées, utiliser des valeurs par défaut
        if (this.langues.length === 0) {
          this.langues = [
            { id: 1, nom: 'Français', codeIso: 'fr' },
            { id: 2, nom: 'Anglais', codeIso: 'en' },
            { id: 3, nom: 'Espagnol', codeIso: 'es' }
          ];
        }
      },
      error: (err) => {
        console.error('Erreur chargement langues:', err);
        // Utiliser des valeurs par défaut en cas d'erreur
        this.langues = [
          { id: 1, nom: 'Français', codeIso: 'fr' },
          { id: 2, nom: 'Anglais', codeIso: 'en' },
          { id: 3, nom: 'Espagnol', codeIso: 'es' }
        ];
        this.loading = false;
      }
    });
  }

  loadLivreData(id: number): void {
    this.loading = true;
    this.livresService.get(id).subscribe({
      next: (livre: Livre) => {
        this.populateForm(livre);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement livre:', err);
        this.loading = false;
        alert('Erreur lors du chargement du livre');
      }
    });
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
      langue: [''], // Maintenant vide par défaut, sera rempli avec les données de l'API
      fichierPrincipal: [null],
      imageCouverture: [null],
      lectureAuto: [false],
      interactif: [false],
      telechargementHorsLigne: [false],
      motsCles: [''],
      anneePublication: ['2024']
    });
  }

  populateForm(livre: Livre): void {
    // Déterminer la langue par défaut
    let langueDefault = '';
    if (livre.langue && typeof livre.langue === 'object') {
      // Si langue est un objet, prendre son ID
      langueDefault = livre.langue.id?.toString() || '';
    } else if (livre.langue) {
      // Si langue est une string, trouver l'ID correspondant
      const langueTrouvee = this.langues.find(l => 
        l.nom?.toLowerCase() === livre.langue?.toString().toLowerCase() || 
        l.codeIso?.toLowerCase() === livre.langue?.toString().toLowerCase()
      );
      langueDefault = langueTrouvee?.id?.toString() || '';
    }

    this.livreForm.patchValue({
      titre: livre.titre || '',
      auteur: livre.auteur || '',
      isbn: livre.isbn || '',
      editeur: livre.editeur || '',
      description: livre.description || '',
      matiere: livre.matiere?.id?.toString() || '',
      niveau: livre.niveau?.id?.toString() || '',
      langue: langueDefault,
      lectureAuto: livre.lectureAuto || false,
      interactif: livre.interactif || false,
      telechargementHorsLigne: false,
      motsCles: this.extractMotsCles((livre as any)?.tags),
      anneePublication: livre.anneePublication?.toString() || '2024'
    });
  }

  private extractMotsCles(tags: any[] | undefined): string {
    if (!tags || !Array.isArray(tags)) return '';
    return tags.map(tag => tag.nom || tag.name || '').join(', ');
  }

  onRetour(): void {
    this.router.navigate(['/admin/livreList']);
  }

  onAnnuler(): void {
    if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
      if (this.isEditMode && this.livreId) {
        this.loadLivreData(this.livreId);
      } else {
        this.livreForm.reset({
          langue: this.getLangueParDefaut(),
          anneePublication: '2024',
          lectureAuto: false,
          interactif: false,
          telechargementHorsLigne: false
        });
      }
    }
  }

  // Obtenir la langue par défaut (première langue de la liste)
  private getLangueParDefaut(): string {
    return this.langues.length > 0 ? this.langues[0].id?.toString() || '' : '';
  }

  // MÉTHODE : Créer le livre d'abord, puis uploader les fichiers
  private createLivreFirstThenUploadFiles(): void {
    const livreData = this.prepareFormData();
    
    if (this.isEditMode && this.livreId) {
      // Mode édition
      this.updateLivre(this.livreId, livreData).then((livre) => {
        this.uploadFiles(livre.id!);
      }).catch((err) => {
        console.error('Erreur lors de la mise à jour du livre:', err);
        this.isSubmitting = false;
      });
    } else {
      // Mode création
      this.createLivre(livreData).then((livre) => {
        this.uploadFiles(livre.id!);
      }).catch((err) => {
        console.error('Erreur lors de la création du livre:', err);
        this.isSubmitting = false;
      });
    }
  }

  // MÉTHODE : Uploader les fichiers après création du livre
  private uploadFiles(livreId: number): void {
    const fichierPrincipal = this.livreForm.get('fichierPrincipal')?.value;
    const imageCouverture = this.livreForm.get('imageCouverture')?.value;

    const uploadPromises = [];

    if (fichierPrincipal instanceof File) {
      uploadPromises.push(this.livresService.uploadFichier(livreId, fichierPrincipal).toPromise());
    }

    if (imageCouverture instanceof File) {
      uploadPromises.push(this.livresService.uploadImage(livreId, imageCouverture).toPromise());
    }

    if (uploadPromises.length > 0) {
      Promise.all(uploadPromises)
        .then(() => {
          alert('Livre et fichiers uploadés avec succès !');
          this.router.navigate(['/admin/livreList']);
        })
        .catch((err) => {
          console.error('Erreur upload fichiers:', err);
          alert('Livre créé mais erreur lors de l\'upload des fichiers');
          this.router.navigate(['/admin/livreList']);
        });
    } else {
      alert('Livre créé avec succès !');
      this.router.navigate(['/admin/livreList']);
    }
  }

  // Méthode principale de soumission
  onSubmit(): void {
    this.markFormGroupTouched(this.livreForm);

    if (this.livreForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const hasFiles = this.livreForm.get('fichierPrincipal')?.value || 
                       this.livreForm.get('imageCouverture')?.value;

      if (hasFiles) {
        // APPROCHE 1: Créer d'abord le livre, puis uploader les fichiers
        this.createLivreFirstThenUploadFiles();
      } else {
        // APPROCHE 2: Utiliser JSON standard sans fichiers
        const livreData = this.prepareFormData();
        if (this.isEditMode && this.livreId) {
          this.updateLivre(this.livreId, livreData);
        } else {
          this.createLivre(livreData);
        }
      }
    } else {
      alert('Veuillez corriger les erreurs dans le formulaire.');
    }
  }

  prepareFormData(): any {
    const formValue = this.livreForm.value;
    
    // Trouver la langue sélectionnée
    const langueId = +formValue.langue;
    const langueSelectionnee = this.langues.find(l => l.id === langueId);
    
    console.log('Données préparées:', {
      titre: formValue.titre,
      langueSelectionnee: langueSelectionnee,
      langueId: langueId
    });
    
    return {
      titre: formValue.titre,
      auteur: formValue.auteur,
      isbn: formValue.isbn,
      editeur: formValue.editeur,
      description: formValue.description,
      matiere: { id: +formValue.matiere },
      niveau: { id: +formValue.niveau },
      langue: langueSelectionnee || { id: langueId }, // Envoyer l'objet langue complet ou au moins l'ID
      anneePublication: +formValue.anneePublication,
      lectureAuto: formValue.lectureAuto,
      interactif: formValue.interactif,
    };
  }

  // Modifier createLivre et updateLivre pour retourner des Promises
  createLivre(livreData: any): Promise<Livre> {
    return new Promise((resolve, reject) => {
      console.log('Création livre avec données:', livreData);
      this.livresService.create(livreData).subscribe({
        next: (livre: Livre) => {
          console.log('Livre créé:', livre);
          this.isSubmitting = false;
          resolve(livre);
        },
        error: (err) => {
          console.error('Erreur création livre:', err);
          this.isSubmitting = false;
          alert('Erreur lors de la création du livre');
          reject(err);
        }
      });
    });
  }

  updateLivre(id: number, livreData: any): Promise<Livre> {
    return new Promise((resolve, reject) => {
      console.log('Mise à jour livre avec données:', livreData);
      this.livresService.update(id, livreData).subscribe({
        next: (livre: Livre) => {
          console.log('Livre mis à jour:', livre);
          this.isSubmitting = false;
          resolve(livre);
        },
        error: (err) => {
          console.error('Erreur mise à jour livre:', err);
          this.isSubmitting = false;
          alert('Erreur lors de la mise à jour du livre');
          reject(err);
        }
      });
    });
  }

  onFileSelected(event: any, type: 'file' | 'image'): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = type === 'file' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      
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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: 'file' | 'image'): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
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