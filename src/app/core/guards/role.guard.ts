import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import {NotificationService} from '../../services/utils/notification.service';
import {AuthService} from '../../services/api/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Récupérer l'utilisateur courant
    const currentUser = this.authService.getCurrentUser();

    // Vérifier si l'utilisateur est connecté
    if (!currentUser) {
      this.handleNotAuthenticated(state.url);
      return false;
    }

    // Récupérer les rôles requis depuis la route
    const requiredRoles = route.data['roles'] as Array<string>;

    // Si aucun rôle n'est requis, autoriser l'accès
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Vérifier si l'utilisateur a au moins un des rôles requis
    const hasRequiredRole = requiredRoles.some(role =>
      this.checkUserRole(currentUser, role)
    );

    if (hasRequiredRole) {
      return true;
    }

    // Gérer l'accès refusé
    this.handleAccessDenied();
    return false;
  }

  /**
   * Vérifie si l'utilisateur a le rôle requis
   */
  private checkUserRole(user: any, requiredRole: string): boolean {
    const userRole = user.role?.toUpperCase();
    const normalizedRequiredRole = requiredRole.toUpperCase();

    // Gestion des rôles hiérarchiques
    const roleHierarchy = this.getRoleHierarchy(userRole);

    return roleHierarchy.includes(normalizedRequiredRole);
  }

  /**
   * Définit la hiérarchie des rôles
   */
  private getRoleHierarchy(userRole: string): string[] {
    const hierarchy: { [key: string]: string[] } = {
      'SUPER_ADMIN': ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
      'ADMIN': ['ADMIN', 'MODERATOR', 'USER'],
      'MODERATOR': ['MODERATOR', 'USER'],
      'USER': ['USER']
    };

    return hierarchy[userRole] || ['USER'];
  }

  /**
   * Gère l'accès non authentifié
   */
  private handleNotAuthenticated(returnUrl: string): void {
    this.notificationService.showWarning(
      'Authentification requise',
      'Veuillez vous connecter pour accéder à cette page.'
    );

    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: returnUrl }
    });
  }

  /**
   * Gère l'accès refusé
   */
  private handleAccessDenied(): void {
    this.notificationService.showError(
      'Accès refusé',
      'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'
    );

    // Rediriger vers le dashboard ou page non autorisée selon le rôle
    const user = this.authService.getCurrentUser();
    if (user && user.role !== 'USER') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/unauthorized']);
    }
  }
}
