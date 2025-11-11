import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Partenaire } from '../../../../models/partenaire.model';
import { PartenaireService } from '../../../../services/api/partenaire.service';

@Component({
  selector: 'app-partenaire-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './partenaire-form.html',
  styleUrls: ['./partenaire-form.css']
})
export class PartenaireForm implements OnInit, OnDestroy {
  partenaireForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  showSuccessModal = false;
  private routeSub: Subscription | undefined;
  partenaireId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private partenaireService: PartenaireService
  ) {
    this.partenaireForm = this.createForm();
  }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.partenaireId = parseInt(params['id']);
        this.loadPartenaire(this.partenaireId);
      }
    });

    // Surveiller les changements sur le type pour afficher/masquer "autre type"
    this.partenaireForm.get('type')?.valueChanges.subscribe(value => {
      if (value === 'autre') {
        this.partenaireForm.get('autreType')?.setValidators([Validators.required]);
      } else {
        this.partenaireForm.get('autreType')?.clearValidators();
        this.partenaireForm.get('autreType')?.setValue('');
      }
      this.partenaireForm.get('autreType')?.updateValueAndValidity();
    });

    // Surveiller les changements sur le pays pour afficher/masquer "autre pays"
    this.partenaireForm.get('pays')?.valueChanges.subscribe(value => {
      if (value === 'autre') {
        this.partenaireForm.get('autrePays')?.setValidators([Validators.required]);
      } else {
        this.partenaireForm.get('autrePays')?.clearValidators();
        this.partenaireForm.get('autrePays')?.setValue('');
      }
      this.partenaireForm.get('autrePays')?.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      domaine: ['', [Validators.required]],
      type: ['', [Validators.required]],
      autreType: [''],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      siteWeb: [''],
      adresse: [''],
      ville: [''],
      pays: ['mali'],
      autrePays: [''],
      statut: ['', [Validators.required]],
      dateDebut: [''],
      description: [''],
      newsletter: [true]
    });
  }

  loadPartenaire(id: number): void {
    this.isLoading = true;

    this.partenaireService.getById(id).subscribe({
      next: (partenaire: Partenaire) => {
        this.partenaireForm.patchValue(partenaire);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du partenaire:', error);
        // Fallback to mock data
        this.loadPartenaireMock(id);
      }
    });
  }

  loadPartenaireMock(id: number): void {
    // Simulation du chargement d'un partenaire existant
    setTimeout(() => {
      const partenaireMock: Partenaire = {
        id: id,
        nom: 'Université de Bamako',
        domaine: 'Éducation supérieure',
        type: 'institution',
        email: 'contact@univ-bamako.ml',
        telephone: '+223 20 21 22 23',
        siteWeb: 'https://www.univ-bamako.ml',
        adresse: 'BP 252 Bamako',
        ville: 'Bamako',
        pays: 'mali',
        statut: 'actif',
        dateDebut: '2024-01-15',
        description: 'Université publique malienne',
        newsletter: true
      };

      this.partenaireForm.patchValue(partenaireMock);
      this.isLoading = false;
    }, 1000);
  }

  get showOtherTypeField(): boolean {
    return this.partenaireForm.get('type')?.value === 'autre';
  }

  get showOtherCountryField(): boolean {
    return this.partenaireForm.get('pays')?.value === 'autre';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.partenaireForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFinalType(): string {
    const type = this.partenaireForm.get('type')?.value;
    return type === 'autre' ? this.partenaireForm.get('autreType')?.value : type;
  }

  getFinalCountry(): string {
    const pays = this.partenaireForm.get('pays')?.value;
    return pays === 'autre' ? this.partenaireForm.get('autrePays')?.value : pays;
  }

  onSubmit(): void {
    if (this.partenaireForm.valid) {
      this.isLoading = true;

      // Préparer les données pour l'envoi
      const formData: Partenaire = {
        ...this.partenaireForm.value,
        type: this.getFinalType(),
        pays: this.getFinalCountry()
      };

      if (this.isEditMode && this.partenaireId) {
        // Update existing partenaire
        this.partenaireService.update(this.partenaireId, formData).subscribe({
          next: (updatedPartenaire) => {
            console.log('Partenaire mis à jour:', updatedPartenaire);
            this.isLoading = false;
            this.showSuccessModal = true;
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour:', error);
            this.isLoading = false;
            // Handle error (show message to user)
          }
        });
      } else {
        // Create new partenaire
        this.partenaireService.create(formData).subscribe({
          next: (newPartenaire) => {
            console.log('Nouveau partenaire créé:', newPartenaire);
            this.isLoading = false;
            this.showSuccessModal = true;
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.isLoading = false;
            // Handle error (show message to user)
          }
        });
      }
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.markAllFieldsAsTouched();
    }
  }

  markAllFieldsAsTouched(): void {
    Object.keys(this.partenaireForm.controls).forEach(key => {
      const control = this.partenaireForm.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    this.partenaireForm.reset({
      pays: 'mali',
      newsletter: true,
      statut: ''
    });
  }

  onCancel(): void {
    if (this.partenaireForm.dirty) {
      if (confirm('Voulez-vous vraiment annuler ? Les modifications non enregistrées seront perdues.')) {
        this.navigateToList();
      }
    } else {
      this.navigateToList();
    }
  }

  navigateToList(): void {
    this.router.navigate(['/admin/partenaire']);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  onSuccessConfirm(): void {
    this.closeSuccessModal();
    this.navigateToList();
  }

  // Getters pour faciliter l'accès aux champs dans le template
  get nom() { return this.partenaireForm.get('nom'); }
  get domaine() { return this.partenaireForm.get('domaine'); }
  get type() { return this.partenaireForm.get('type'); }
  get email() { return this.partenaireForm.get('email'); }
  get telephone() { return this.partenaireForm.get('telephone'); }
  get siteWeb() { return this.partenaireForm.get('siteWeb'); }
  get statut() { return this.partenaireForm.get('statut'); }
}