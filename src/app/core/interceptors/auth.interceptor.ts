import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../../services/api/auth.service';
import { environment } from '../../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	private isRefreshing = false;
	private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
	private jwtHelper = new JwtHelperService();

	constructor(private auth: AuthService) {}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// Log TOUTES les requêtes pour débogage
		console.log('🔵 Intercepteur appelé pour:', req.method, req.url);
		console.log('🔵 Headers actuels:', req.headers.keys());
		
		// Ne pas intercepter les requêtes de login
		if (req.url.includes('/auth/login')) {
			console.log('🔵 Intercepteur: Requête de login, pas d\'interception');
			return next.handle(req);
		}

		// Mode développement : bypass de l'authentification si activé
		// MAIS : si le backend nécessite un token, on l'envoie quand même
		if (environment.bypassAuth) {
			console.log('🔵 Intercepteur: Mode bypass activé');
			// Même en mode bypass, essayons d'envoyer le token si disponible
			// car le backend pourrait le nécessiter
			const token = this.auth.getToken();
			if (token) {
				console.log('🔵 Intercepteur: Token disponible en mode bypass, ajout du header Authorization');
				const cloned = req.clone({
					setHeaders: {
						Authorization: `Bearer ${token}`
					}
				});
				return next.handle(cloned);
			}
			console.log('🔵 Intercepteur: Pas de token disponible, envoi sans authentification');
			return next.handle(req);
		}

		const token = this.auth.getToken();
		console.log('Intercepteur: Token récupéré:', token ? `${token.substring(0, 20)}...` : 'AUCUN TOKEN');
		console.log('Intercepteur: Requête pour:', req.url);
		console.log('Intercepteur: Méthode:', req.method);
		
		// Si pas de token, essayer de se connecter automatiquement
		if (!token) {
			console.log('Intercepteur: Aucun token trouvé, login automatique nécessaire');
			return this.handleAutoLogin(req, next);
		}

		// Vérifier si le token est expiré
		try {
			const isExpired = this.jwtHelper.isTokenExpired(token);
			if (isExpired) {
				console.log('Intercepteur: Token expiré détecté, reconnexion nécessaire');
				localStorage.removeItem('auth_token');
				return this.handleAutoLogin(req, next);
			}
			const decodedToken = this.jwtHelper.decodeToken(token);
			console.log('Intercepteur: Token valide, utilisateur:', decodedToken?.sub || 'N/A');
		} catch (error) {
			console.error('Intercepteur: Erreur lors de la vérification du token:', error);
			// Si le token est invalide, essayer de se reconnecter
			localStorage.removeItem('auth_token');
			return this.handleAutoLogin(req, next);
		}

		// Ajouter le token à la requête
		const cloned = req.clone({
			setHeaders: {
				Authorization: `Bearer ${token}`
			}
		});

		console.log('Intercepteur: Token ajouté au header Authorization pour:', req.url);
		console.log('Intercepteur: Header Authorization:', `Bearer ${token.substring(0, 20)}...`);

		return next.handle(cloned).pipe(
			catchError((error: HttpErrorResponse) => {
				// Si erreur 403 ou 401, le token est probablement invalide
				if (error.status === 403 || error.status === 401) {
					console.log(`Intercepteur: Erreur ${error.status} détectée pour ${req.url}`);
					console.log('Intercepteur: Token utilisé:', token ? `${token.substring(0, 20)}...` : 'AUCUN');
					console.log('Intercepteur: Réponse du serveur:', error.message || error.statusText);
					// Supprimer le token invalide
					localStorage.removeItem('auth_token');
					
					// Si le mode bypass est activé, réessayer sans authentification
					if (environment.bypassAuth) {
						console.log('Intercepteur: Mode bypass activé, réessai sans authentification');
						return next.handle(req);
					}
					
					return this.handle403Error(req, next);
				}
				return throwError(() => error);
			})
		);
	}

	private handleAutoLogin(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// Si un refresh est déjà en cours, attendre qu'il se termine
		if (this.isRefreshing) {
			return this.refreshTokenSubject.pipe(
				filter(token => token !== null),
				take(1),
				switchMap((token) => {
					const cloned = req.clone({
						setHeaders: {
							Authorization: `Bearer ${token}`
						}
					});
					return next.handle(cloned);
				})
			);
		}

		// Démarrer un nouveau refresh
		this.isRefreshing = true;
		this.refreshTokenSubject.next(null);

		const credentials = environment.defaultCredentials;
		console.log('Intercepteur: Tentative de login automatique pour:', req.url);
		
		return this.auth.login(credentials.email, credentials.password).pipe(
			switchMap((response) => {
				if (!response.token) {
					throw new Error('Token non reçu dans la réponse de login');
				}
				
				this.isRefreshing = false;
				this.refreshTokenSubject.next(response.token);
				
				// Réessayer la requête originale avec le nouveau token
				const cloned = req.clone({
					setHeaders: {
						Authorization: `Bearer ${response.token}`
					}
				});
				console.log('Intercepteur: Login réussi, réessai de la requête:', req.url);
				return next.handle(cloned);
			}),
			catchError((error) => {
				this.isRefreshing = false;
				this.refreshTokenSubject.next(null);
				console.error('Intercepteur: Échec du login automatique:', error);
				return throwError(() => error);
			})
		);
	}

	private handle403Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// Si un refresh est déjà en cours, attendre qu'il se termine
		if (this.isRefreshing) {
			return this.refreshTokenSubject.pipe(
				filter(token => token !== null),
				take(1),
				switchMap((token) => {
					if (!token) {
						// Si le token est null, réessayer le login
						return this.handleAutoLogin(req, next);
					}
					const cloned = req.clone({
						setHeaders: {
							Authorization: `Bearer ${token}`
						}
					});
					return next.handle(cloned);
				})
			);
		}

		// Démarrer un nouveau refresh
		this.isRefreshing = true;
		this.refreshTokenSubject.next(null);

		const credentials = environment.defaultCredentials;
		console.log('Intercepteur: Erreur 403/401 détectée, suppression du token invalide et reconnexion pour:', req.url);
		
		// S'assurer que le token invalide est supprimé
		localStorage.removeItem('auth_token');
		
		return this.auth.login(credentials.email, credentials.password).pipe(
			switchMap((response) => {
				if (!response.token) {
					throw new Error('Token non reçu dans la réponse de login');
				}
				
				this.isRefreshing = false;
				this.refreshTokenSubject.next(response.token);
				
				// Réessayer la requête originale avec le nouveau token
				const cloned = req.clone({
					setHeaders: {
						Authorization: `Bearer ${response.token}`
					}
				});
				console.log('Intercepteur: Reconnexion réussie, réessai de la requête:', req.url);
				return next.handle(cloned);
			}),
			catchError((error) => {
				this.isRefreshing = false;
				this.refreshTokenSubject.next(null);
				console.error('Intercepteur: Échec de la reconnexion après 403:', error);
				return throwError(() => error);
			})
		);
	}
}