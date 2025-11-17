import { Component, Input, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  }

  // Gestion des modals Profil
  openProfileModal() {
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  updateProfile() {
    console.log('Profil mis à jour:', this.profileData);
    // Implémentez l'appel API pour mettre à jour le profil
    this.closeProfileModal();
    this.close.emit();
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
    console.log('Changement de mot de passe:', this.passwordData);
    // Implémentez l'appel API pour changer le mot de passe
    this.closePasswordModal();
    this.close.emit();
  }

  // Gestion des modals Préférences
  openPreferencesModal() {
    this.showPreferencesModal = true;
  }

  closePreferencesModal() {
    this.showPreferencesModal = false;
  }

  updatePreferences() {
    console.log('Préférences mises à jour:', this.preferences);
    // Implémentez l'appel API pour sauvegarder les préférences
    this.closePreferencesModal();
    this.close.emit();
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