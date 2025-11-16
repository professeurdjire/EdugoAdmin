import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersService } from '../../../../services/api/admin/users.service';
import { User } from '../../../../api/model/user';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-utilisateur-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './utilisateur-form.html',
  styleUrls: ['./utilisateur-form.css']
})
export class UtilisateurForm implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  userId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      niveau: [''],
      classe: [''],
      pointAccumule: [0],
      estActive: [true],
      // Champs Eleve supplémentaires
      dateNaissance: [''],
      photoProfil: [''],
      dateCreation: [''],
      dateModification: [''],
      role: [''],
      username: [''],
      enabled: [true],
      accountNonExpired: [true],
      accountNonLocked: [true],
      credentialsNonExpired: [true]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.userId = idParam ? Number(idParam) : null;

    if (this.userId) {
      this.loadUser(this.userId);
    }
  }

  private loadUser(id: number): void {
    this.loading = true;
    this.error = null;

    this.usersService.get(id).subscribe({
      next: (user: User) => {
        this.loading = false;
        this.patchFormFromUser(user);
      },
      error: (err) => {
        console.error('Erreur chargement utilisateur:', err);
        this.loading = false;
        this.error = "Impossible de charger les informations de l'utilisateur.";
      }
    });
  }

  private patchFormFromUser(user: User): void {
    const anyUser = user as any;
    this.form.patchValue({
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email || '',
      telephone: anyUser.telephone || '',
      niveau: anyUser.niveau || '',
      classe: anyUser.classe || '',
      pointAccumule: anyUser.pointAccumule ?? 0,
      estActive: user.estActive ?? true,
      dateNaissance: anyUser.dateNaissance || '',
      photoProfil: anyUser.photoProfil || '',
      dateCreation: user.dateCreation || '',
      dateModification: user.dateModification || '',
      role: anyUser.role || '',
      username: anyUser.username || '',
      enabled: anyUser.enabled ?? true,
      accountNonExpired: anyUser.accountNonExpired ?? true,
      accountNonLocked: anyUser.accountNonLocked ?? true,
      credentialsNonExpired: anyUser.credentialsNonExpired ?? true
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.userId) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const payload: Partial<User> = {
      prenom: this.form.value.prenom,
      nom: this.form.value.nom,
      email: this.form.value.email,
      estActive: this.form.value.estActive,
      // Champs étendus pour Eleve (le backend devra les accepter sur l'entité cible)
      ...(this.form.value.telephone ? { telephone: this.form.value.telephone } as any : {}),
      ...(this.form.value.niveau ? { niveau: this.form.value.niveau } as any : {}),
      ...(this.form.value.classe ? { classe: this.form.value.classe } as any : {}),
      ...(this.form.value.pointAccumule != null ? { pointAccumule: this.form.value.pointAccumule } as any : {}),
      ...(this.form.value.dateNaissance ? { dateNaissance: this.form.value.dateNaissance } as any : {}),
      ...(this.form.value.photoProfil ? { photoProfil: this.form.value.photoProfil } as any : {}),
      ...(this.form.value.dateCreation ? { dateCreation: this.form.value.dateCreation } as any : {}),
      ...(this.form.value.dateModification ? { dateModification: this.form.value.dateModification } as any : {}),
      ...(this.form.value.role ? { role: this.form.value.role } as any : {}),
      ...(this.form.value.username ? { username: this.form.value.username } as any : {}),
      enabled: this.form.value.enabled,
      accountNonExpired: this.form.value.accountNonExpired,
      accountNonLocked: this.form.value.accountNonLocked,
      credentialsNonExpired: this.form.value.credentialsNonExpired,
    } as any;

    this.usersService.update(this.userId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success("Utilisateur mis à jour avec succès");
        this.router.navigate(['/admin/utilisateurs']);
      },
      error: (err) => {
        console.error('Erreur mise à jour utilisateur:', err);
        this.loading = false;
        this.error = "Erreur lors de la mise à jour de l'utilisateur.";
      }
    });
  }
}
