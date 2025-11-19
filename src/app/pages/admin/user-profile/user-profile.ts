import { Component, Input, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAccountService, AdminPreferencesDto, ChangePasswordRequest } from '../../../services/api/admin/admin-account.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-user-profile-dropdown',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfileDropdownComponent implements OnInit {
  @Input() user: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<string>();

  // États des modals
  showProfileModal = false;
  showPasswordModal = false;
  showPreferencesModal = false;

  // Données des formulaires
  profileData = {
    prenom: '',
    nom: '',
    email: '',
    telephone: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  preferences = {
    emailNotifications: true,
    pushNotifications: true,
    theme: 'light',
    language: 'fr'
  };

  constructor(
    private adminAccount: AdminAccountService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Initialiser avec les données utilisateur
    if (this.user) {
      this.profileData = {
        prenom: this.user.prenom || '',
        nom: this.user.nom || '',
        email: this.user.email || '',
        telephone: this.user.telephone || ''
      };
    }

    // Charger les préférences de l'admin courant
    this.adminAccount.getPreferences().subscribe({
      next: (prefs: AdminPreferencesDto) => {
        this.preferences = {
          emailNotifications: prefs.notificationsEmail ?? this.preferences.emailNotifications,
          pushNotifications: prefs.notificationsInApp ?? this.preferences.pushNotifications,
          theme: prefs.theme ?? this.preferences.theme,
          language: prefs.langueInterface ?? this.preferences.language
        };
      },
      error: () => {
        // Pas bloquant si les préférences ne se chargent pas
      }
    });
  }

  // Gestion des modals Profil
  openProfileModal() {
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  updateProfile() {
    const payload: Partial<any> = {
      prenom: this.profileData.prenom,
      nom: this.profileData.nom,
      email: this.profileData.email,
      telephone: this.profileData.telephone
    };

    this.adminAccount.updateMe(payload).subscribe({
      next: () => {
        this.toast.success('Profil mis à jour avec succès.');
        this.closeProfileModal();
        this.close.emit();
      },
      error: () => {
        this.toast.error('Une erreur est survenue lors de la mise à jour du profil.');
      }
    });
  }

  // Gestion des modals Mot de Passe
  openPasswordModal() {
    this.showPasswordModal = true;
    // Réinitialiser le formulaire
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  closePasswordModal() {
    this.showPasswordModal = false;
  }

  isPasswordFormValid(): boolean {
    return this.passwordData.currentPassword.length >= 6 &&
           this.passwordData.newPassword.length >= 8 &&
           this.passwordData.newPassword === this.passwordData.confirmPassword;
  }

  changePassword() {
    const payload: ChangePasswordRequest = {
      oldPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    };

    this.adminAccount.changePassword(payload).subscribe({
      next: () => {
        this.toast.success('Mot de passe mis à jour avec succès.');
        this.closePasswordModal();
        this.close.emit();
      },
      error: (err) => {
        console.error('Erreur changement mot de passe:', err);
        this.toast.error('Impossible de changer le mot de passe. Vérifiez l\'ancien mot de passe.');
      }
    });
  }

  // Gestion des modals Préférences
  openPreferencesModal() {
    this.showPreferencesModal = true;
  }

  closePreferencesModal() {
    this.showPreferencesModal = false;
  }

  updatePreferences() {
    const prefs: AdminPreferencesDto = {
      notificationsEmail: this.preferences.emailNotifications,
      notificationsInApp: this.preferences.pushNotifications,
      theme: this.preferences.theme,
      langueInterface: this.preferences.language
    };

    this.adminAccount.updatePreferences(prefs).subscribe({
      next: () => {
        this.toast.success('Préférences mises à jour avec succès.');
        this.closePreferencesModal();
        this.close.emit();
      },
      error: (err) => {
        console.error('Erreur mise à jour préférences:', err);
        this.toast.error('Une erreur est survenue lors de la mise à jour des préférences.');
      }
    });
  }

  // Actions générales
  onAction(actionType: string) {
    this.action.emit(actionType);
    this.close.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown') && !target.closest('.user-profile')) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    // Fermer le modal actif ou le dropdown
    if (this.showProfileModal) {
      this.closeProfileModal();
    } else if (this.showPasswordModal) {
      this.closePasswordModal();
    } else if (this.showPreferencesModal) {
      this.closePreferencesModal();
    } else {
      this.close.emit();
    }
  }
}