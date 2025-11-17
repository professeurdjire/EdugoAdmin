import { Injectable } from '@angular/core';
import { AuthService } from '../../services/api/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  constructor(private authService: AuthService) {}

  init(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Si le mode bypass est activé, ne pas essayer de se connecter
      if (environment.bypassAuth) {
        console.log('⚠️ Mode bypass activé: Authentification désactivée pour le développement');
        resolve(true);
        return;
      }

      // Si un token de développement est fourni, l'utiliser directement
      // MAIS : si le mode bypass est activé, on ne fait rien ici
      if (environment.devToken && !environment.bypassAuth) {
        console.log('🔑 Utilisation du token de développement fourni');
        localStorage.setItem('auth_token', environment.devToken);
        localStorage.setItem('auth_refresh_token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBlZHVnby5jb20iLCJpYXQiOjE3NjI2NzI5MTksImV4cCI6MTc2MzI3NzcxOX0.hBKOOOZj6_8f-8BRnfX6_4PDKIu8GCKIrVnH105XsNM');
        
        // Créer un utilisateur mock pour le développement
        const devUser = {
          id: 1,
          email: 'admin@edugo.com',
          nom: 'Admin',
          prenom: 'Principal',
          role: 'ADMIN',
          estActive: true,
          dateCreation: new Date().toISOString()
        };
        localStorage.setItem('user_data', JSON.stringify(devUser));
        
        // Mettre à jour le BehaviorSubject de l'utilisateur
        (this.authService as any).currentUserSubject.next(devUser);
        
        console.log('✅ Token de développement configuré avec succès');
        console.log('✅ Utilisateur configuré:', devUser.email, '- Role:', devUser.role);
        resolve(true);
        return;
      }

      // Toujours supprimer le token existant et faire un nouveau login
      // Cela évite les problèmes avec des tokens expirés ou invalides
      console.log('🔄 Initialisation: Suppression du token existant et renouvellement...');
      
      // Supprimer le token existant pour forcer un nouveau login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');

      // Try to login automatically with default credentials
      const credentials = environment.defaultCredentials;
      if (!credentials || !credentials.email || !credentials.password) {
        console.error('❌ Default credentials not configured in environment.ts');
        resolve(false);
        return;
      }

      console.log('🔄 Attempting automatic login with:', credentials.email);
      
      this.authService.login(credentials.email, credentials.password).subscribe({
        next: (response) => {
          if (response.token) {
            console.log('✅ Automatic login successful! Token obtained.');
            resolve(true);
          } else {
            console.error('❌ Login succeeded but no token received in response');
            resolve(false);
          }
        },
        error: (error) => {
          console.error('❌ Automatic login failed:', error);
          if (error.status === 401 || error.status === 403) {
            console.error('🔐 Authentication error: Credentials may be incorrect or user does not exist');
            console.warn('💡 Please verify credentials in src/environments/environment.ts');
          } else if (error.status === 0) {
            console.error('🌐 Cannot connect to backend. Verify server is running on port 8089');
          } else {
            console.error('❌ Unknown error:', error.message || error);
          }
          // Don't block the application if auto-login fails
          resolve(false);
        }
      });
    });
  }
}