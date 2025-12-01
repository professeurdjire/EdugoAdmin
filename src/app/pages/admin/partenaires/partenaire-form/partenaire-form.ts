import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Partenaire } from '../../../../models/partenaire.model';
import { PartenaireService } from '../../../../services/api/partenaire.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';

interface PartenaireForms {
  id?: number;
  nom: string;
  domaine: string;
  type: string;
  autreType?: string;
  email: string;
  telephone?: string;
  siteWeb?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  autrePays?: string;
  statut: string;
  dateDebut?: string;
  description?: string;
  newsletter: boolean;
}

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
  private currentId?: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private partenaireService: PartenaireService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {
    this.partenaireForm = this.createForm();
  }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.currentId = parseInt(params['id']);
        this.loadPartenaire(this.currentId);
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
    console.log('Chargement du partenaire avec ID:', id);
    
    this.partenaireService.getById(id).subscribe({
      next: (p: Partenaire) => {
        console.log('Partenaire chargé depuis API:', p);
        console.log('Type de la réponse:', typeof p);
        console.log('Clés de l\'objet:', Object.keys(p || {}));
        
        if (!p) {
          console.error('Partenaire est null ou undefined');
          this.toast.error('Aucune donnée reçue pour ce partenaire.');
          this.isLoading = false;
          return;
        }
        
        // Formater la date pour l'input date (format YYYY-MM-DD)
        const formatDateForInput = (dateStr: string | undefined): string => {
          if (!dateStr) return '';
          try {
            // Gérer différents formats de date
            let date: Date;
            if (typeof dateStr === 'string') {
              // Si c'est déjà au format YYYY-MM-DD, le retourner tel quel
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
              }
              date = new Date(dateStr);
            } else {
              date = new Date(dateStr);
            }
            
            if (isNaN(date.getTime())) {
              console.warn('Date invalide:', dateStr);
              return '';
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          } catch (e) {
            console.warn('Erreur formatage date:', e, 'dateStr:', dateStr);
            return '';
          }
        };

        // Déterminer si le type ou le pays est "autre"
        const typeValue = (p.type || '').trim();
        const paysValue = (p.pays || 'mali').trim().toLowerCase();
        
        // Si le type n'est pas dans la liste des options, c'est probablement un "autre"
        const typeOptions = ['institution', 'entreprise', 'ong', 'gouvernement', 'autre'];
        const isTypeAutre = typeValue && !typeOptions.includes(typeValue.toLowerCase());
        
        // Si le pays n'est pas "mali" ou "autre", alors c'est "autre"
        const isPaysAutre = paysValue && paysValue !== 'mali' && paysValue !== 'autre';

        // Gérer le statut - peut venir de 'statut' ou 'actif'
        let statutValue = p.statut || '';
        if (!statutValue && p.actif !== undefined) {
          statutValue = p.actif ? 'actif' : 'inactif';
        }

        const formValue: PartenaireForms = {
          id: p.id,
          nom: p.nom || '',
          domaine: p.domaine || '',
          type: isTypeAutre ? 'autre' : (typeValue || ''),
          autreType: isTypeAutre ? typeValue : (p.autreType || ''),
          email: p.email || '',
          telephone: p.telephone || '',
          siteWeb: p.siteWeb || '',
          adresse: p.adresse || '',
          ville: p.ville || '',
          pays: isPaysAutre ? 'autre' : (paysValue || 'mali'),
          autrePays: isPaysAutre ? (p.pays || '') : (p.autrePays || ''),
          statut: statutValue,
          dateDebut: formatDateForInput(p.dateDebut || p.dateAjout || p.dateCreation),
          description: p.description || '',
          newsletter: p.newsletter !== undefined ? p.newsletter : true
        };
        
        console.log('Valeurs du formulaire préparées:', formValue);
        
        // Charger les valeurs dans le formulaire
        this.partenaireForm.patchValue(formValue, { emitEvent: false });
        
        // Forcer la mise à jour des validateurs pour les champs conditionnels
        if (formValue.type === 'autre' && formValue.autreType) {
          this.partenaireForm.get('autreType')?.setValidators([Validators.required]);
          this.partenaireForm.get('autreType')?.updateValueAndValidity();
        }
        
        if (formValue.pays === 'autre' && formValue.autrePays) {
          this.partenaireForm.get('autrePays')?.setValidators([Validators.required]);
          this.partenaireForm.get('autrePays')?.updateValueAndValidity();
        }
        
        // Déclencher les événements de changement pour afficher les champs conditionnels
        if (formValue.type === 'autre') {
          this.partenaireForm.get('type')?.setValue('autre', { emitEvent: true });
        }
        
        if (formValue.pays === 'autre') {
          this.partenaireForm.get('pays')?.setValue('autre', { emitEvent: true });
        }
        
        console.log('Valeurs après patchValue:', this.partenaireForm.value);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement partenaire:', err);
        console.error('Détails de l\'erreur:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        this.toast.error('Impossible de charger les informations de ce partenaire.');
        this.isLoading = false;
      }
    });
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
      const formData: PartenaireForms = {
        ...this.partenaireForm.value,
        type: this.getFinalType(),
        pays: this.getFinalCountry()
      };
      const payload: Partenaire = {
        id: this.currentId,
        nom: formData.nom,
        domaine: formData.domaine,
        type: formData.type,
        autreType: formData.autreType,
        email: formData.email,
        telephone: formData.telephone,
        siteWeb: formData.siteWeb,
        adresse: formData.adresse,
        ville: formData.ville,
        pays: formData.pays,
        autrePays: formData.autrePays,
        statut: formData.statut,
        dateDebut: formData.dateDebut,
        dateAjout: formData.dateDebut,
        description: formData.description,
        newsletter: formData.newsletter,
        actif: formData.statut === 'actif'
      };

      const request$ = this.isEditMode && this.currentId
        ? this.partenaireService.update(this.currentId, payload)
        : this.partenaireService.create(payload);

      request$.subscribe({
        next: () => {
          this.isLoading = false;
          this.showSuccessModal = true;
        },
        error: (err) => {
          console.error('Erreur enregistrement partenaire:', err);
          this.toast.error('Une erreur est survenue lors de l\'enregistrement du partenaire. Veuillez réessayer.');
          this.isLoading = false;
        }
      });
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