import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsModalComponent } from '../../../../pages/admin/notifications/notifications';
import { UserProfileDropdownComponent } from '../../../../pages/admin/user-profile/user-profile';
import { AuthService } from '../../../../services/api/auth.service';
import { SidebarStateService } from '../sidebar/sidebar-state.service';

@Component({
  selector: 'app-navebar',
  imports: [CommonModule, NotificationsModalComponent, UserProfileDropdownComponent],
  templateUrl: './navebar.html',
  standalone: true,
  styleUrls: ['./navebar.css'],
})
export class Navebar {
  showNotifications = false;
  showProfile = false;

  // doit respecter la forme attendue par app-user-profile-dropdown
  user: { id: number; prenom: string; nom: string; email: string; role: 'admin' | 'moderator' | 'user'; createdAt: Date } | null = null;

  unreadCount = 0;

  constructor(private auth: AuthService, private sidebarState: SidebarStateService) {
    const u = this.auth.getCurrentUser();
    if (u) {
      this.user = this.toProfileUser(u);
    }
    // Option: s'abonner pour réagir aux changements
    this.auth.currentUser$.subscribe((usr) => {
      this.user = usr ? this.toProfileUser(usr) : null;
    });
  }

  private toProfileUser(u: any) {
    const role = (u.role || '').toString().toLowerCase();
    const mappedRole: 'admin' | 'moderator' | 'user' =
      role === 'admin' ? 'admin' : role === 'moderator' ? 'moderator' : 'user';
    const createdAt = u.createdAt ? new Date(u.createdAt) : (u.dateCreation ? new Date(u.dateCreation) : new Date());
    return {
      id: u.id ?? 0,
      prenom: u.prenom ?? '',
      nom: u.nom ?? '',
      email: u.email ?? '',
      role: mappedRole,
      createdAt,
    };
  }

  toggleSidebar() {
    this.sidebarState.toggle();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      // Simuler un nombre de non lus si nécessaire
      this.unreadCount = this.unreadCount; // no-op pour garder la prop
    }
  }

  toggleProfile() {
    this.showProfile = !this.showProfile;
  }

  getUserInitials(): string {
    if (!this.user) return '';
    return `${this.user.prenom?.charAt(0) ?? ''}${this.user.nom?.charAt(0) ?? ''}`.toUpperCase();
  }

  getRoleDisplayName(): string {
    if (!this.user) return '';
    const map: Record<string, string> = {
      admin: 'Administrateur',
      moderator: 'Modérateur',
      user: 'Utilisateur',
    };
    return map[this.user.role] ?? 'Utilisateur';
  }

  handleProfileAction(action: string) {
    // Gérer les actions du dropdown profil si nécessaire
    console.debug('Profile action:', action);
    if (action === 'logout') {
      // Implémenter la déconnexion si besoin
    }
  }
}
