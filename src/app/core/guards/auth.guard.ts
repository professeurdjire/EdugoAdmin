import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from '../../services/api/auth.service';
import {NotificationService} from '../../services/utils/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Vérifier si l'utilisateur est connecté
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();

      // Vérifier si le token est expiré
      if (this.authService.isTokenExpired()) {
        this.handleTokenExpired();
        return false;
      }

      // Vérifier si le compte est actif
      if (!user?.estActive) {
        this.handleInactiveAccount();
        return false;
      }

      return true;
    }

    // Rediriger vers la page de login si non connecté
    this.handleNotLoggedIn(state.url);
    return false;
  }

  private handleTokenExpired(): void {
    this.authService.logout();
    this.notificationService.showError(
      'Session expirée',
      'Votre session a expiré. Veuillez vous reconnecter.'
    );
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  private handleInactiveAccount(): void {
    this.authService.logout();
    this.notificationService.showError(
      'Compte désactivé',
      'Votre compte a été désactivé. Contactez l\'administrateur.'
    );
    this.router.navigate(['/auth/login']);
  }

  private handleNotLoggedIn(returnUrl: string): void {
    this.notificationService.showWarning(
      'Accès non autorisé',
      'Veuillez vous connecter pour accéder à cette page.'
    );

    // Stocker l'URL de retour pour rediriger après la connexion
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: returnUrl }
    });
  }
}
