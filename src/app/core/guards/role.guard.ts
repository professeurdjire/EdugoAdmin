// role.guard.ts - CORRIGÉ
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { NotificationService } from '../../services/utils/notification.service';
import { AuthService, User } from '../../services/api/auth.service';

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

    // Vérifier d'abord si l'utilisateur est connecté
    if (!this.authService.isLoggedIn()) {
      this.handleNotAuthenticated(state.url);
      return false;
    }

    // Récupérer l'utilisateur courant
    const currentUser = this.authService.getCurrentUser();

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

  private checkUserRole(user: User, requiredRole: string): boolean {
    const userRole = user.role?.toUpperCase();
    const normalizedRequiredRole = requiredRole.toUpperCase();
    
    if (userRole === 'ADMIN') {
      return true; // L'admin a accès à tout
    }
    
    return userRole === normalizedRequiredRole;
  }

  private handleNotAuthenticated(returnUrl: string): void {
    this.notificationService.showWarning(
      'Authentification requise',
      'Veuillez vous connecter pour accéder à cette page.'
    );

    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: returnUrl }
    });
  }

  private handleAccessDenied(): void {
    this.notificationService.showError(
      'Accès refusé',
      'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'
    );

    const user = this.authService.getCurrentUser();
    if (user && user.role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/eleve/dashboard']);
    }
  }
}