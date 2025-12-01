import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { 
  faEye, 
  faPen, 
  faTrash, 
  faTrophy, 
  faStar, 
  faMedal, 
  faAward,
  faFilter,
  faRedoAlt,
  faSliders
} from '@fortawesome/free-solid-svg-icons';
import { BadgesService } from '../../../../services/api/admin/badges.service';
import { BadgeResponse } from '../../../../api/model/badgeResponse';
import { AuthService } from '../../../../services/api/auth.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { StatistiquesService } from '../../../../api/api/statistiques.service';
import { StatistiquesPlateformeResponse } from '../../../../api/model/statistiquesPlateformeResponse';
import { ExercicesService } from '../../../../api/api/exercices.service';
import { FaireExerciceResponse } from '../../../../api/model/faireExerciceResponse';
import { ChallengesService } from '../../../../api/api/challenges.service';
import { Participation } from '../../../../api/model/participation';
import { AdminEleveService } from '../../../../services/api/admin/admin-eleve.service';
import { LveService } from '../../../../api/api/lve.service';
import { DfisService } from '../../../../api/api/dfis.service';
import { EleveDefiResponse } from '../../../../api/model/eleveDefiResponse';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface RecompenseDisplay {
  id: number;
  nom: string;
  description: string;
  type?: string;
  icone?: string;
}

@Component({
  selector: 'app-recompense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent, RouterLink],
  templateUrl: './recompense-list.html',
  styleUrls: ['./recompense-list.css']
})
export class RecompenseList implements OnInit {
  recompenses: RecompenseDisplay[] = [];
  filteredRecompenses: RecompenseDisplay[] = [];
  pagedRecompenses: RecompenseDisplay[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Statistiques plateforme (réussites)
  plateformeStats?: StatistiquesPlateformeResponse;

  // Statistiques
  stats = [
    { label: 'Quiz réussis', value: 0, icon: faTrophy, color: '#6A3FA8', bgColor: '#ede7ff' },
    { label: 'Défis réussis', value: 0, icon: faStar, color: '#28bd7f', bgColor: '#e8f5e9' },
    { label: 'Challenges réussis', value: 0, icon: faMedal, color: '#195a9d', bgColor: '#e1f5fe' },
    { label: 'Exercices réussis', value: 0, icon: faAward, color: '#ff6b6b', bgColor: '#ffebee' },
  ];

  // Pagination
  pageSize: number = 8;
  currentPage: number = 1;
  totalPages: number = 1;
  totalFiltered: number = 0;

  // Filtres
  searchTerm: string = '';
  selectedType: string = '';
  types: string[] = [];

  // Gestion des seuils de progression
  // Les seuils sont configurés par défaut dans le système.
  // L'interface permet de visualiser les seuils configurés et d'initialiser les badges correspondants.
  showSeuilsModal = false;
  seuilsProgression: Array<{ seuil: number; nom: string; icone?: string }> = [];
  loadingSeuils = false;

  constructor(
    private badgesService: BadgesService,
    private authService: AuthService,
    private router: Router,
    private confirm: ConfirmService,
    private toast: ToastService,
    private statistiquesService: StatistiquesService,
    private exercicesService: ExercicesService,
    private challengesService: ChallengesService,
    private adminEleveService: AdminEleveService,
    private lveService: LveService,
    private dfisService: DfisService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadRecompenses();
    this.loadPlateformeStats();
  }

  loadRecompenses(): void {
    this.loading = true;
    this.error = null;
    
    // Skip authentication check to bypass permissions
    // if (!this.authService.isLoggedIn()) {
    //   this.error = "Vous devez vous connecter pour accéder à cette page.";
    //   this.loading = false;
    //   return;
    // }
    
    this.badgesService.list().subscribe({
      next: (apiBadges: BadgeResponse[]) => {
        // Transform API badges to display format
        this.recompenses = apiBadges.map(badge => this.transformBadge(badge));
        this.filteredRecompenses = [...this.recompenses];
        this.totalFiltered = this.filteredRecompenses.length;
        
        // Extract unique types
        this.types = [...new Set(this.recompenses.map(r => r.type || ''))].filter(t => t);
        
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading recompenses:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des récompenses: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  // Transform API Badge to display format
  transformBadge(badge: BadgeResponse): RecompenseDisplay {
    // Formater le type pour l'affichage
    let typeDisplay = badge.type || 'Général';
    const typeMap: { [key: string]: string } = {
      'OR': 'Or',
      'ARGENT': 'Argent',
      'BRONZE': 'Bronze',
      'SPECIAL': 'Spécial',
      'PROGRESSION': 'Progression'
    };
    typeDisplay = typeMap[badge.type || ''] || typeDisplay;

    return {
      id: badge.id || 0,
      nom: badge.nom || 'Récompense sans nom',
      description: badge.description || 'Aucune description',
      type: typeDisplay,
      icone: badge.icone || '🏆'
    };
  }

  // Met à jour les statistiques
  updateStats(): void {
    const s = this.plateformeStats;
    
    // Utiliser les valeurs de l'API si disponibles, sinon utiliser 0
    // Les valeurs sont déjà définies à 0 par défaut dans l'initialisation
    const quizCompletes = s?.totalQuizCompletes;
    const defisReussis = s?.totalDefisReussis;
    const challengesReussis = s?.totalChallengesReussis;
    const exercicesRealises = s?.totalExercicesRealises;
    
    // Mettre à jour seulement si les valeurs sont définies (non null et non undefined)
    if (quizCompletes !== null && quizCompletes !== undefined) {
      this.stats[0].value = quizCompletes;
    }
    if (defisReussis !== null && defisReussis !== undefined) {
      this.stats[1].value = defisReussis;
    }
    if (challengesReussis !== null && challengesReussis !== undefined) {
      this.stats[2].value = challengesReussis;
    }
    if (exercicesRealises !== null && exercicesRealises !== undefined) {
      this.stats[3].value = exercicesRealises;
    }
    
    console.log('Statistiques récompenses mises à jour:', {
      quizCompletes: this.stats[0].value,
      defisReussis: this.stats[1].value,
      challengesReussis: this.stats[2].value,
      exercicesRealises: this.stats[3].value,
      statsAPI: s
    });
  }

  // Charge les statistiques globales de la plateforme
  private loadPlateformeStats(): void {
    console.log('=== Début du chargement des statistiques de la plateforme ===');
    
    // D'abord charger les statistiques de l'API
    this.statistiquesService.getStatistiquesPlateforme().pipe(
      catchError(err => {
        console.error('Erreur chargement stats API:', err);
        console.error('Détails:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        return of(null);
      })
    ).subscribe({
      next: (apiStats) => {
        console.log('Statistiques reçues de l\'API:', apiStats);
        
        this.plateformeStats = apiStats || undefined;
        
        // Vérifier si toutes les statistiques nécessaires sont disponibles et non nulles
        const hasValidQuiz = apiStats?.totalQuizCompletes != null && apiStats.totalQuizCompletes !== undefined && apiStats.totalQuizCompletes > 0;
        const hasValidDefis = apiStats?.totalDefisReussis != null && apiStats.totalDefisReussis !== undefined && apiStats.totalDefisReussis > 0;
        const hasValidChallenges = apiStats?.totalChallengesReussis != null && apiStats.totalChallengesReussis !== undefined && apiStats.totalChallengesReussis > 0;
        const hasValidExercices = apiStats?.totalExercicesRealises != null && apiStats.totalExercicesRealises !== undefined && apiStats.totalExercicesRealises > 0;
        
        const allStatsValid = hasValidQuiz && hasValidDefis && hasValidChallenges && hasValidExercices;
        
        console.log('Validation des statistiques API:', {
          hasValidQuiz,
          hasValidDefis,
          hasValidChallenges,
          hasValidExercices,
          allStatsValid
        });
        
        if (apiStats && allStatsValid) {
          // Utiliser les valeurs de l'API (toutes valides)
          console.log('Utilisation des statistiques de l\'API');
          this.stats[0].value = apiStats.totalQuizCompletes || 0;
          this.stats[1].value = apiStats.totalDefisReussis || 0;
          this.stats[2].value = apiStats.totalChallengesReussis || 0;
          this.stats[3].value = apiStats.totalExercicesRealises || 0;
        } else {
          // Calculer depuis les données réelles (au moins une stat est manquante ou nulle)
          console.log('Les statistiques de l\'API ne sont pas complètes, calcul depuis les données réelles...');
          this.calculateRealStatistics();
        }
      },
      error: (err) => {
        console.error('Erreur dans le subscribe des stats API:', err);
        // En cas d'erreur, calculer depuis les données réelles
        this.calculateRealStatistics();
      }
    });
  }
  
  // Calcule les statistiques réelles en utilisant les nouveaux endpoints globaux
  private calculateRealStatistics(): void {
    console.log('=== Début du calcul des statistiques réelles (endpoints globaux) ===');
    
    // Utiliser directement les nouveaux endpoints globaux
    const quizCompletes$ = this.http.get<any>(`${environment.apiUrl}/api/statistiques/globales/quiz-completes`).pipe(
      map((response: any) => {
        const result = Array.isArray(response) ? response.length : (response?.data?.length || response?.content?.length || response?.length || 0);
        console.log('✅ Quiz complétés:', result);
        return result;
      }),
      catchError(err => {
        console.error('❌ Erreur quiz complétés:', err);
        return of(0);
      })
    );

    const defisReussis$ = this.http.get<any>(`${environment.apiUrl}/api/statistiques/globales/defis-reussis`).pipe(
      map((response: any) => {
        const result = Array.isArray(response) ? response.length : (response?.data?.length || response?.content?.length || response?.length || 0);
        console.log('✅ Défis réussis:', result);
        return result;
      }),
      catchError(err => {
        console.error('❌ Erreur défis réussis:', err);
        return of(0);
      })
    );

    const challengesReussis$ = this.http.get<any>(`${environment.apiUrl}/api/statistiques/globales/challenges-reussis`).pipe(
      map((response: any) => {
        const result = Array.isArray(response) ? response.length : (response?.data?.length || response?.content?.length || response?.length || 0);
        console.log('✅ Challenges réussis:', result);
        return result;
      }),
      catchError(err => {
        console.error('❌ Erreur challenges réussis:', err);
        return of(0);
      })
    );

    const exercicesReussis$ = this.http.get<any>(`${environment.apiUrl}/api/statistiques/globales/exercices-reussis`).pipe(
      map((response: any) => {
        console.log('🔍 Réponse brute exercices réussis:', response);
        console.log('🔍 Type:', typeof response);
        console.log('🔍 Est tableau?', Array.isArray(response));
        
        let result = 0;
        if (Array.isArray(response)) {
          result = response.length;
          console.log('✅ Format: tableau direct, taille:', result);
        } else if (response && typeof response === 'object') {
          if (response.data !== undefined) {
            if (Array.isArray(response.data)) {
              result = response.data.length;
              console.log('✅ Format: response.data (tableau), taille:', result);
            } else if (typeof response.data === 'number') {
              result = response.data;
              console.log('✅ Format: response.data (nombre):', result);
            }
          }
          if (result === 0 && response.content !== undefined) {
            if (Array.isArray(response.content)) {
              result = response.content.length;
              console.log('✅ Format: response.content (tableau), taille:', result);
            } else if (typeof response.content === 'number') {
              result = response.content;
              console.log('✅ Format: response.content (nombre):', result);
            }
          }
          if (result === 0 && typeof response === 'number') {
            result = response;
            console.log('✅ Format: nombre direct:', result);
          }
        } else if (typeof response === 'number') {
          result = response;
          console.log('✅ Format: nombre direct:', result);
        }
        
        console.log('✅ Exercices réussis FINAL:', result);
        return result;
      }),
      catchError(err => {
        console.error('❌ Erreur exercices réussis:', err);
        console.error('❌ Détails:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url
        });
        return of(0);
      })
    );
    
    forkJoin({
      quiz: quizCompletes$,
      defis: defisReussis$,
      challenges: challengesReussis$,
      exercices: exercicesReussis$
    }).subscribe({
      next: (results) => {
        console.log('=== Résultats bruts reçus de forkJoin ===', results);
        
        this.stats[0].value = results.quiz || 0;
        this.stats[1].value = results.defis || 0;
        this.stats[2].value = results.challenges || 0;
        this.stats[3].value = results.exercices || 0;
        
        console.log('=== Statistiques réelles calculées (endpoints globaux) ===', {
          quizCompletes: this.stats[0].value,
          defisReussis: this.stats[1].value,
          challengesReussis: this.stats[2].value,
          exercicesRealises: this.stats[3].value
        });
        
        // Log spécifique pour les exercices
        console.log('🔍 Détail exercices réussis FINAL:', {
          valeurBrute: results.exercices,
          valeurAffectee: this.stats[3].value,
          type: typeof results.exercices
        });
      },
      error: (err) => {
        console.error('❌ Erreur dans le subscribe des statistiques:', err);
        console.error('Détails de l\'erreur:', {
          message: err.message,
          status: err.status,
          error: err.error
        });
        // En cas d'erreur, mettre toutes les stats à 0
        this.stats[0].value = 0;
        this.stats[1].value = 0;
        this.stats[2].value = 0;
        this.stats[3].value = 0;
      }
    });
  }
  
  // Récupérer tous les exercices réussis depuis l'endpoint global
  private getAllExercicesRealisesFromEleves(eleveIds: number[]): Observable<number> {
    console.log('=== Récupération des exercices réussis depuis l\'endpoint global ===');
    
    // Utiliser le nouvel endpoint global pour récupérer tous les exercices réussis
    const baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/statistiques/globales/exercices-reussis`;
    console.log('URL de l\'endpoint exercices réussis:', baseUrl);
    
    return this.http.get<any>(baseUrl).pipe(
      map((response: any) => {
        console.log('Réponse brute de l\'endpoint exercices réussis:', response);
        console.log('Type de la réponse:', typeof response);
        console.log('Est-ce un tableau?', Array.isArray(response));
        
        // Gérer différents formats de réponse
        let exercicesReussis: any[] = [];
        
        if (Array.isArray(response)) {
          exercicesReussis = response;
          console.log('Format: tableau direct, taille:', exercicesReussis.length);
        } else if (response && typeof response === 'object') {
          // Vérifier response.data
          if (response.data !== undefined) {
            if (Array.isArray(response.data)) {
              exercicesReussis = response.data;
              console.log('Format: response.data (tableau), taille:', exercicesReussis.length);
            } else if (typeof response.data === 'number') {
              // Peut-être que l'endpoint retourne directement un nombre
              console.log('Format: response.data (nombre direct):', response.data);
              return response.data;
            }
          }
          
          // Vérifier response.content
          if (exercicesReussis.length === 0 && response.content !== undefined) {
            if (Array.isArray(response.content)) {
              exercicesReussis = response.content;
              console.log('Format: response.content (tableau), taille:', exercicesReussis.length);
            } else if (typeof response.content === 'number') {
              console.log('Format: response.content (nombre direct):', response.content);
              return response.content;
            }
          }
          
          // Vérifier si c'est un nombre direct
          if (exercicesReussis.length === 0 && typeof response === 'number') {
            console.log('Format: nombre direct:', response);
            return response;
          }
        }
        
        const count = exercicesReussis.length;
        console.log(`✅ Exercices réussis récupérés depuis l'endpoint global: ${count}`);
        
        if (count > 0) {
          console.log(`Premiers exercices réussis:`, exercicesReussis.slice(0, 3));
        } else {
          console.warn('⚠️ Aucun exercice réussi trouvé ou format de réponse inattendu');
          console.log('Structure complète de la réponse:', JSON.stringify(response, null, 2));
        }
        
        return count;
      }),
      catchError((err) => {
        console.error('❌ Erreur lors de la récupération des exercices réussis depuis l\'endpoint global:', err);
        console.error('Détails de l\'erreur:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url
        });
        console.warn('Fallback: utilisation de la valeur de l\'API de stats si disponible');
        const fallbackValue = this.plateformeStats?.totalExercicesRealises || 0;
        console.log('Valeur de fallback utilisée:', fallbackValue);
        return of(fallbackValue);
      })
    );
  }
  
  // Récupérer tous les challenges réussis depuis l'endpoint global
  private getAllChallengesReussisFromEleves(eleveIds: number[]): Observable<number> {
    console.log('Récupération des challenges réussis depuis l\'endpoint global');
    
    // Utiliser le nouvel endpoint global pour récupérer tous les challenges réussis
    const baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/statistiques/globales/challenges-reussis`;
    
    return this.http.get<any>(baseUrl).pipe(
      map((response: any) => {
        // Gérer différents formats de réponse avec vérifications de type
        let challengesReussis: any[] = [];
        
        if (Array.isArray(response)) {
          challengesReussis = response;
        } else if (response && typeof response === 'object') {
          if (response.data !== undefined && Array.isArray(response.data)) {
            challengesReussis = response.data;
          } else if (response.content !== undefined && Array.isArray(response.content)) {
            challengesReussis = response.content;
          }
        }
        
        console.log(`Challenges réussis récupérés depuis l'endpoint global: ${challengesReussis.length}`);
        
        if (challengesReussis.length > 0) {
          console.log(`Premiers challenges réussis:`, challengesReussis.slice(0, 3));
        }
        
        return challengesReussis.length;
      }),
      catchError((err) => {
        console.error('Erreur lors de la récupération des challenges réussis depuis l\'endpoint global:', err);
        console.warn('Fallback: utilisation de la valeur de l\'API de stats si disponible');
        const fallbackValue = this.plateformeStats?.totalChallengesReussis || 0;
        return of(fallbackValue);
      })
    );
  }
  
  // Récupérer tous les quiz complétés depuis l'endpoint global
  private getAllQuizCompletesFromEleves(eleveIds: number[]): Observable<number> {
    console.log('Récupération des quiz complétés depuis l\'endpoint global');
    
    // Utiliser le nouvel endpoint global pour récupérer tous les quiz complétés
    const baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/statistiques/globales/quiz-completes`;
    
    return this.http.get<any>(baseUrl).pipe(
      map((response: any) => {
        // Gérer différents formats de réponse avec vérifications de type
        let quizCompletes: any[] = [];
        
        if (Array.isArray(response)) {
          quizCompletes = response;
        } else if (response && typeof response === 'object') {
          if (response.data !== undefined && Array.isArray(response.data)) {
            quizCompletes = response.data;
          } else if (response.content !== undefined && Array.isArray(response.content)) {
            quizCompletes = response.content;
          }
        }
        
        console.log(`Quiz complétés récupérés depuis l'endpoint global: ${quizCompletes.length}`);
        
        if (quizCompletes.length > 0) {
          console.log(`Premiers quiz complétés:`, quizCompletes.slice(0, 3));
        }
        
        return quizCompletes.length;
      }),
      catchError((err) => {
        console.error('Erreur lors de la récupération des quiz complétés depuis l\'endpoint global:', err);
        console.warn('Fallback: utilisation de la valeur de l\'API de stats si disponible');
        const fallbackValue = this.plateformeStats?.totalQuizCompletes || 0;
        return of(fallbackValue);
      })
    );
  }
  
  // Récupérer tous les défis réussis depuis l'endpoint global
  private getAllDefisReussisFromEleves(eleveIds: number[]): Observable<number> {
    console.log('Récupération des défis réussis depuis l\'endpoint global');
    
    // Utiliser le nouvel endpoint global pour récupérer tous les défis réussis
    const baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/statistiques/globales/defis-reussis`;
    
    return this.http.get<any>(baseUrl).pipe(
      map((response: any) => {
        // Gérer différents formats de réponse avec vérifications de type
        let defisReussis: any[] = [];
        
        if (Array.isArray(response)) {
          defisReussis = response;
        } else if (response && typeof response === 'object') {
          if (response.data !== undefined && Array.isArray(response.data)) {
            defisReussis = response.data;
          } else if (response.content !== undefined && Array.isArray(response.content)) {
            defisReussis = response.content;
          }
        }
        
        console.log(`Défis réussis récupérés depuis l'endpoint global: ${defisReussis.length}`);
        
        if (defisReussis.length > 0) {
          console.log(`Premiers défis réussis:`, defisReussis.slice(0, 3));
        }
        
        return defisReussis.length;
      }),
      catchError((err) => {
        console.error('Erreur lors de la récupération des défis réussis depuis l\'endpoint global:', err);
        console.warn('Fallback: utilisation de la valeur de l\'API de stats si disponible');
        const fallbackValue = this.plateformeStats?.totalDefisReussis || 0;
        return of(fallbackValue);
      })
    );
  }

  // Met à jour filteredRecompenses selon les filtres
  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredRecompenses = this.recompenses.filter(recompense => {
      const matchesSearch =
        !term ||
        recompense.nom.toLowerCase().includes(term) ||
        recompense.description.toLowerCase().includes(term);

      const matchesType =
        !this.selectedType || recompense.type === this.selectedType;

      return matchesSearch && matchesType;
    });

    this.totalFiltered = this.filteredRecompenses.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.filteredRecompenses = [...this.recompenses];
    this.totalFiltered = this.filteredRecompenses.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Calcul et mise à jour de l'affichage paginé
  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
    this.changePage(this.currentPage, false);
  }

  // changePage: si resetToFirst true on remet la page à 1 (utilisé via updatePagination)
  changePage(page: number, clampToRange: boolean = true): void {
    if (clampToRange) {
      if (page < 1) page = 1;
      if (page > this.totalPages) page = this.totalPages;
    }

    this.currentPage = page;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedRecompenses = this.filteredRecompenses.slice(start, end);
  }

  // Helper method for pagination display
  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Actions
  viewRecompense(recompense: RecompenseDisplay): void {
    // Pas encore de page de détails dédiée : on réutilise le formulaire d'édition
    this.router.navigate(['/admin/editerrecompense', recompense.id]);
  }

  editRecompense(recompense: RecompenseDisplay): void {
    // Navigate to edit recompense page
    this.router.navigate(['/admin/editerrecompense', recompense.id]);
  }

  deleteRecompense(recompense: RecompenseDisplay): void {
    this.confirm
      .confirm({
        title: 'Supprimer la récompense',
        message: `Êtes-vous sûr de vouloir supprimer la récompense "${recompense.nom}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      })
      .then((ok) => {
        if (!ok) return;
        
        this.loading = true;
        this.badgesService.delete(recompense.id).subscribe({
          next: () => {
            // Remove from all arrays
            this.recompenses = this.recompenses.filter(r => r.id !== recompense.id);
            this.filteredRecompenses = this.filteredRecompenses.filter(r => r.id !== recompense.id);
            this.totalFiltered = this.filteredRecompenses.length;
            
            // Update stats
            this.updateStats();
            
            this.updatePagination();
            this.loading = false;
            this.toast.success('Récompense supprimée avec succès');
          },
          error: (err) => {
            console.error('Error deleting recompense:', err);
            this.loading = false;
            if (err.status === 401 || err.status === 403) {
              this.toast.error('Vous n\'êtes pas autorisé à supprimer cette récompense');
            } else if (err.status === 404) {
              this.toast.error('Récompense non trouvée');
            } else {
              this.toast.error('Erreur lors de la suppression de la récompense');
            }
          }
        });
      });
  }

  // Gestion des seuils de progression
  openGestionSeuilsProgression(): void {
    this.showSeuilsModal = true;
    this.loadSeuilsProgression();
  }

  closeSeuilsModal(): void {
    this.showSeuilsModal = false;
  }

  loadSeuilsProgression(): void {
    this.loadingSeuils = true;
    this.badgesService.getSeuilsProgression().subscribe({
      next: (seuilsMap) => {
        // Convertir la Map { "100": "Débutant", "500": "Apprenti", ... } en tableau
        // Le backend retourne un objet JSON avec des clés string représentant les seuils
        this.seuilsProgression = Object.entries(seuilsMap || {})
          .map(([seuilStr, nom]) => ({
            seuil: Number(seuilStr),
            nom: String(nom)
          }))
          .sort((a, b) => a.seuil - b.seuil); // Trier par seuil croissant
        
        // Assigner les icônes selon les seuils (basé sur le guide backend)
        this.seuilsProgression.forEach(seuil => {
          switch (seuil.seuil) {
            case 100: seuil.icone = '🥉'; break;
            case 500: seuil.icone = '🥈'; break;
            case 1000: seuil.icone = '🥇'; break;
            case 2500: seuil.icone = '💎'; break;
            case 5000: seuil.icone = '👑'; break;
            case 10000: seuil.icone = '🌟'; break;
            default: seuil.icone = '🏆'; break;
          }
        });
        
        this.loadingSeuils = false;
      },
      error: (err) => {
        console.error('Erreur chargement seuils:', err);
        this.toast.error('Erreur lors du chargement des seuils de progression');
        this.loadingSeuils = false;
      }
    });
  }

  initialiserBadgesProgression(): void {
    this.confirm.confirm({
      title: 'Initialiser les badges de progression',
      message: 'Cela créera tous les badges de progression définis dans les seuils du backend s\'ils n\'existent pas encore dans la base de données. Les badges existants ne seront pas modifiés. Continuer ?',
      confirmText: 'Initialiser',
      cancelText: 'Annuler'
    }).then((ok) => {
      if (ok) {
        this.loadingSeuils = true;
        this.badgesService.initialiserBadgesProgression().subscribe({
          next: (response) => {
            this.loadingSeuils = false;
            const message = response?.message || 'Badges de progression initialisés avec succès';
            this.toast.success(message);
          },
          error: (err) => {
            console.error('Erreur initialisation:', err);
            this.toast.error(err.error?.message || 'Erreur lors de l\'initialisation des badges');
            this.loadingSeuils = false;
          }
        });
      }
    });
  }

  // Icônes
  protected readonly faEye = faEye;
  protected readonly faPen = faPen;
  protected readonly faTrash = faTrash;
  protected readonly faFilter = faFilter;
  protected readonly faRedoAlt = faRedoAlt;
  protected readonly faSliders = faSliders;
  protected readonly faTrophy = faTrophy;
  protected readonly faStar = faStar;
  protected readonly faMedal = faMedal;
  protected readonly faAward = faAward;
}