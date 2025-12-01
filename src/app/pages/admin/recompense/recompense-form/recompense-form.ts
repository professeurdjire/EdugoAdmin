import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BadgesService } from '../../../../services/api/admin/badges.service';
import { BadgeRequest } from '../../../../api/model/badgeRequest';
import { BadgeRequestExtended } from '../../../../api/model/badgeRequestExtended';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';

@Component({
  selector: 'app-recompense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './recompense-form.html',
  styleUrls: ['./recompense-form.css']
})
export class RecompenseForm implements OnInit, OnDestroy {
  form: FormGroup;
  isEditMode = false;
  isLoading = false;
  private routeSub?: Subscription;
  private currentId?: number;
  availableIcons: string[] = ['🏆', '🎖️', '⭐', '🥇', '🥈', '🥉', '🎯', '📚', '⚡', '💎', '👑', '🌟', '🎓', '✨'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private badgesService: BadgesService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['', [Validators.required]],
      icone: ['🏆', [Validators.required]],
      seuil: [null] // Seuil de points pour les badges de progression
    });

    // Mettre à jour les validateurs dynamiquement selon le type
    this.form.get('type')?.valueChanges.subscribe(type => {
      const seuilControl = this.form.get('seuil');
      if (type === 'PROGRESSION') {
        seuilControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        seuilControl?.clearValidators();
        seuilControl?.setValue(null);
      }
      seuilControl?.updateValueAndValidity();
    });
  }

  selectIcon(icon: string): void {
    this.form.get('icone')?.setValue(icon);
  }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.currentId = +params['id'];
        this.loadRecompense(this.currentId);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private loadRecompense(id: number): void {
    this.isLoading = true;
    this.badgesService.get(id).subscribe({
      next: (badge) => {
        // Charger le seuil si c'est un badge de progression (peut nécessiter un appel API supplémentaire)
        this.form.patchValue({
          nom: badge.nom,
          description: badge.description,
          type: badge.type,
          icone: badge.icone,
          seuil: (badge as any).seuil || null
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement récompense:', err);
        this.toast.error('Impossible de charger la récompense');
        this.isLoading = false;
      }
    });
  }

  onAnnuler(): void {
    this.confirm
      .confirm({
        title: 'Annuler',
        message: 'Voulez-vous vraiment annuler ? Toutes les modifications non enregistrées seront perdues.',
        confirmText: 'Annuler',
        cancelText: 'Continuer'
      })
      .then(ok => {
        if (ok) {
          this.router.navigate(['/admin/recompenselist']);
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      this.toast.error('Veuillez corriger les informations du badge avant de continuer.');
      return;
    }

    const v = this.form.value;
    // Utiliser BadgeRequestExtended pour inclure PROGRESSION
    const payload: BadgeRequestExtended & { seuil?: number } = {
      id: this.currentId,
      nom: v.nom,
      description: v.description,
      type: v.type as BadgeRequestExtended['type'], // Supporte PROGRESSION
      icone: v.icone
    };

    // Ajouter le seuil si c'est un badge de progression
    if (v.type === 'PROGRESSION' && v.seuil) {
      (payload as any).seuil = Number(v.seuil);
    }

    this.isLoading = true;
    const request$ = this.isEditMode && this.currentId
      ? this.badgesService.update(this.currentId, payload)
      : this.badgesService.create(payload);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        const badgeType = v.type === 'PROGRESSION' 
          ? 'Badge de progression enregistré avec succès. Il sera attribué automatiquement aux élèves atteignant le seuil de points correspondant.'
          : 'Badge enregistré avec succès, il est prêt à être utilisé dans vos challenges.';
        this.toast.success(badgeType);
        this.router.navigate(['/admin/recompenselist']);
      },
      error: (err) => {
        console.error('Erreur enregistrement récompense:', err);
        this.toast.error('Une erreur est survenue lors de l\'enregistrement du badge. Veuillez réessayer.');
        this.isLoading = false;
      }
    });
  }
}
