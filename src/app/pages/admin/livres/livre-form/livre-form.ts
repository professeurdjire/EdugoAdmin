import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LivresService } from '../../../../services/api/admin/livres.service';
import { MatieresService } from '../../../../services/api/admin/matieres.service';
import { NiveauxService } from '../../../../services/api/admin/niveaux.service';
import { LanguesService } from '../../../../services/api/admin/langues.service';
import { ClassesService } from '../../../../services/api/admin/classes.service';
import { Livre } from '../../../../api/model/livre';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { Matiere } from '../../../../api/model/matiere';
import { Niveau } from '../../../../api/model/niveau';
import { Langue } from '../../../../api/model/langue'; // NOUVEAU MODÈLE
import { Classe } from '../../../../api/model/classe';
import { firstValueFrom } from 'rxjs';

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
  isReadOnly = false;
  livreId: number | null = null;
  loading = false;

  // Données pour les sélecteurs
  matieres: Matiere[] = [];
  niveaux: Niveau[] = [];
  langues: Langue[] = []; // MAINTENANT chargé depuis l'API
  classes: Classe[] = [];
  annees: number[] = [];
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private livresService: LivresService,
    private matieresService: MatieresService,
    private niveauxService: NiveauxService,
    private languesService: LanguesService,
    private classesService: ClassesService,
    private toast: ToastService, // NOUVEAU SERVICE INJECTÉ
    private confirm: ConfirmService
  ) {
    this.livreForm = this.createForm();
  }

  ngOnInit(): void {
    // Générer une liste d'années dynamiquement (ex: 1970 -> année courante)
    const start = 1970;
    this.annees = Array.from({ length: this.currentYear - start + 1 }, (_, i) => this.currentYear - i);
    this.loadReferenceData();
    this.checkEditMode();

    // Déterminer si on est en mode lecture seule (mode=view)
    this.route.queryParamMap.subscribe(params => {
      this.isReadOnly = params.get('mode') === 'view';
      if (this.isReadOnly) {
        this.livreForm.disable({ emitEvent: false });
      } else if (!this.isSubmitting) {
        this.livreForm.enable({ emitEvent: false });
      }
    });

    // Charger les classes
    this.classesService.list().subscribe({
      next: (classes: Classe[]) => {
        this.classes = classes;
      },
      error: (err) => {
        console.error('Erreur chargement classes:', err);
        this.classes = [];
      }
    });
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
        this.toast.error('Erreur lors du chargement du livre');
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
      classe: ['', [Validators.required]],
      langue: ['', [Validators.required]], // Maintenant obligatoire
      fichierPrincipal: [null],
      imageCouverture: [null],
      lectureAuto: [false],
      interactif: [false],
      telechargementHorsLigne: [false],
      motsCles: [''],
      anneePublication: [String(this.currentYear), [Validators.required, Validators.pattern(/^(19|20)\d{2}$/)]]
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
      classe: livre.classe?.id?.toString() || '',
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
    this.router.navigate(['/admin/livrelist']);
  }

  onAnnuler(): void {
    this.confirm.confirm({
      title: 'Annuler',
      message: 'Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.',
      confirmText: 'Annuler',
      cancelText: 'Continuer'
    }).then((ok) => {
      if (!ok) return;
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
    });
  }

  // Obtenir la langue par défaut (première langue de la liste)
  private getLangueParDefaut(): string {
    return this.langues.length > 0 ? this.langues[0].id?.toString() || '' : '';
  }

  // MÉTHODE : Créer le livre d'abord, puis uploader les fichiers
  private createLivreFirstThenUploadFiles(): void {
    const fichierPrincipal = this.livreForm.get('fichierPrincipal')?.value as File | null;
    const imageCouverture = this.livreForm.get('imageCouverture')?.value as File | null;
    const livreData = this.prepareFormData();

    if (!this.isEditMode) {
      this.createLivre(livreData, fichierPrincipal!, imageCouverture!)
        .then(() => this.confirmRedirectToList('Le livre a été ajouté avec succès.'))
        .catch((err) => this.displayBackendErrors(err));
      return;
    }

    this.updateLivre(this.livreId!, livreData, fichierPrincipal || undefined, imageCouverture || undefined)
      .then(() => this.confirmRedirectToList('Le livre a été mis à jour avec succès.'))
      .catch((err) => this.displayBackendErrors(err));
  }

  // MÉTHODE : Uploader les fichiers après création du livre
  private uploadFiles(livreId: number): void {
    const fichierPrincipal = this.livreForm.get('fichierPrincipal')?.value;
    const imageCouverture = this.livreForm.get('imageCouverture')?.value;

    const uploadPromises = [];

    if (fichierPrincipal instanceof File) {
      uploadPromises.push(firstValueFrom(this.livresService.uploadFichier(livreId, fichierPrincipal)));
    }

    if (imageCouverture instanceof File) {
      uploadPromises.push(firstValueFrom(this.livresService.uploadImage(livreId, imageCouverture)));
    }

    if (uploadPromises.length > 0) {
      Promise.all(uploadPromises)
        .then(() => {
          this.confirmRedirectToList('Le livre a été ajouté avec succès.');
        })
        .catch((err) => {
          console.error('Erreur upload fichiers:', err);
          this.toast.error("Livre créé mais erreur lors de l'upload des fichiers");
          // Rester sur place pour permettre une nouvelle tentative ou retour manuel
        });
    } else {
      this.confirmRedirectToList('Le livre a été ajouté avec succès.');
    }
  }

  // Méthode principale de soumission
  onSubmit(): void {
    this.markFormGroupTouched(this.livreForm);

    if (this.livreForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const fichier = this.livreForm.get('fichierPrincipal')?.value;
      const image = this.livreForm.get('imageCouverture')?.value;
      const hasFiles = fichier || image;

      // CRÉATION: fichier principal ET image requis
      if (!this.isEditMode) {
        if (!(fichier instanceof File) || !(image instanceof File)) {
          this.isSubmitting = false;
          this.toast.error("Le fichier principal (PDF/EPUB) et l'image de couverture sont obligatoires pour créer un livre.");
          return;
        }
        // Créer puis uploader
        this.createLivreFirstThenUploadFiles();
        return;
      }

      // MISE À JOUR: fichiers optionnels, on accepte la mise à jour des métadonnées seule
      if (hasFiles) {
        this.createLivreFirstThenUploadFiles();
        return;
      }

      // Mise à jour sans fichiers
      const livreData = this.prepareFormData();
      if (this.isEditMode && this.livreId) {
        this.updateLivre(this.livreId, livreData)
          .then(() => this.confirmRedirectToList('Le livre a été mis à jour avec succès.'))
          .catch((err) => this.displayBackendErrors(err));
      }
    } else {
      this.toast.warning('Veuillez corriger les erreurs dans le formulaire.');
    }
  }

  prepareFormData(): any {
    const formValue = this.livreForm.value;
    
    // Trouver la langue sélectionnée
    const langueId = +formValue.langue;
    const langueSelectionnee = this.langues.find(l => l.id === langueId);
    
    console.log('Données préparées (DTO):', {
      titre: formValue.titre,
      langueId: langueId,
      matiereId: +formValue.matiere,
      niveauId: +formValue.niveau,
      classeId: +formValue.classe,
      anneePublication: +formValue.anneePublication
    });
    
    // Adapter aux champs attendus par le DTO backend (LivreRequest)
    return {
      titre: formValue.titre,
      auteur: formValue.auteur,
      isbn: formValue.isbn,
      editeur: formValue.editeur,
      description: formValue.description,
      anneePublication: +formValue.anneePublication,
      lectureAuto: formValue.lectureAuto,
      interactif: formValue.interactif,
      // Champs d'association sous forme d'IDs (flat)
      matiereId: +formValue.matiere,
      niveauId: +formValue.niveau,
      langueId: langueSelectionnee?.id ?? langueId,
      classeId: +formValue.classe,
      // Facultatifs dans le DTO, non gérés par le formulaire pour l'instant
      // totalPages, imageCouverture, classeId seront ignorés s'ils ne sont pas fournis
    };
  }

// Modifier createLivre pour gérer multipart/form-data et retourner une Promise
createLivre(livreData: any, document: File, image?: File): Promise<Livre> {
  return new Promise((resolve, reject) => {
    console.log('Création livre avec données:', livreData);

    this.livresService.create(livreData, document, image).subscribe({
      next: (livre: Livre) => {
        console.log('Livre créé:', livre);
        this.isSubmitting = false;
        resolve(livre);
      },
      error: (err) => {
        console.error('Erreur création livre:', err);
        this.isSubmitting = false;
        this.displayBackendErrors(err);
        reject(err);
      }
    });
  });
}


 updateLivre(id: number, livreData: any, document?: File, image?: File): Promise<Livre> {
  return new Promise((resolve, reject) => {
    console.log('Mise à jour livre avec données:', livreData);

    this.livresService.updateWithFiles(id, livreData, document, image).subscribe({
      next: (livre: Livre) => {
        console.log('Livre mis à jour:', livre);
        this.isSubmitting = false;
        resolve(livre);
      },
      error: (err) => {
        console.error('Erreur mise à jour livre:', err);
        this.isSubmitting = false;
        this.displayBackendErrors(err);
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
        this.toast.warning(`Le fichier est trop volumineux. Taille max: ${type === 'file' ? '50MB' : '10MB'}`);
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

  private confirmRedirectToList(message: string) {
    this.confirm
      .confirm({
        title: 'Livre créé',
        message,
        confirmText: 'Aller à la liste',
        cancelText: 'Rester ici'
      })
      .then((ok) => {
        if (ok) {
          this.router.navigate(['/admin/livrelist']);
        }
      });
  }

  private displayBackendErrors(err: any) {
    const errors: string[] = [];
    const e = err?.error;
    if (e) {
      if (Array.isArray(e.errors)) {
        e.errors.forEach((it: any) => {
          const msg = it?.message || it?.defaultMessage || it?.error || JSON.stringify(it);
          if (msg) errors.push(msg);
        });
      }
      if (typeof e.message === 'string') {
        errors.push(e.message);
      }
    }
    if (errors.length === 0) {
      errors.push('Une erreur est survenue lors du traitement de votre demande.');
    }
    // Afficher chaque erreur
    errors.slice(0, 5).forEach(m => this.toast.error(m));
  }
}