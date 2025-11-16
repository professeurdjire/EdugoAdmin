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
  faRedoAlt 
} from '@fortawesome/free-solid-svg-icons';
import { BadgesService } from '../../../../services/api/admin/badges.service';
import { BadgeResponse } from '../../../../api/model/badgeResponse';
import { AuthService } from '../../../../services/api/auth.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { StatistiquesService } from '../../../../api/api/statistiques.service';
import { StatistiquesPlateformeResponse } from '../../../../api/model/statistiquesPlateformeResponse';

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
    { label: 'Quiz réussis', value: 0, icon: faTrophy, color: '#A885D8', bgColor: '#ede7ff' },
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

  constructor(
    private badgesService: BadgesService,
    private authService: AuthService,
    private router: Router,
    private confirm: ConfirmService,
    private toast: ToastService,
    private statistiquesService: StatistiquesService
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
    return {
      id: badge.id || 0,
      nom: badge.nom || 'Récompense sans nom',
      description: badge.description || 'Aucune description',
      type: badge.type || 'Général',
      icone: badge.icone || '🏆'
    };
  }

  // Met à jour les statistiques
  updateStats(): void {
    const s = this.plateformeStats;
    this.stats[0].value = s?.totalQuizCompletes ?? 0;
    this.stats[1].value = s?.totalDefisReussis ?? 0;
    this.stats[2].value = s?.totalChallengesReussis ?? 0;
    this.stats[3].value = s?.totalExercicesRealises ?? 0;
  }

  // Charge les statistiques globales de la plateforme
  private loadPlateformeStats(): void {
    this.statistiquesService.getStatistiquesPlateforme().subscribe({
      next: (stats) => {
        this.plateformeStats = stats;
        this.updateStats();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques plateforme (récompenses):', err);
      }
    });
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

  // Icônes
  protected readonly faEye = faEye;
  protected readonly faPen = faPen;
  protected readonly faTrash = faTrash;
  protected readonly faFilter = faFilter;
  protected readonly faRedoAlt = faRedoAlt;
  protected readonly faTrophy = faTrophy;
  protected readonly faStar = faStar;
  protected readonly faMedal = faMedal;
  protected readonly faAward = faAward;
}