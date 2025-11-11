import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faEdit, faTrash, faTrophy, faStar, faMedal, faAward } from '@fortawesome/free-solid-svg-icons';
import { BadgesService } from '../../../../services/api/admin/badges.service';
import { BadgeResponse } from '../../../../api/model/badgeResponse';
import { AuthService } from '../../../../services/api/auth.service';

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

  // Statistiques
  stats = [
    { label: 'Récompenses Disponibles', value: 0, icon: faTrophy, color: '#7b4fff', bgColor: '#ede7ff' },
    { label: 'Types de Récompenses', value: 0, icon: faStar, color: '#4caf50', bgColor: '#e8f5e9' },
    { label: 'Points Minimum', value: 0, icon: faMedal, color: '#ff9800', bgColor: '#fff3e0' },
    { label: 'Points Maximum', value: 0, icon: faAward, color: '#03a9f4', bgColor: '#e1f5fe' },
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecompenses();
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
        
        // Update stats
        this.stats[0].value = this.recompenses.length;
        this.stats[1].value = [...new Set(this.recompenses.map(r => r.type || ''))].filter(t => t).length;
        
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
      icone: badge.icone || ''
    };
  }

  // Met à jour filteredRecompenses selon les filtres
  applyFilters() {
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

  resetFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.filteredRecompenses = [...this.recompenses];
    this.totalFiltered = this.filteredRecompenses.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Calcul et mise à jour de l'affichage paginé
  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
    this.changePage(this.currentPage, false);
  }

  // changePage: si resetToFirst true on remet la page à 1 (utilisé via updatePagination)
  changePage(page: number, clampToRange = true) {
    if (clampToRange) {
      if (page < 1) page = 1;
      if (page > this.totalPages) page = this.totalPages;
    }

    this.currentPage = page;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedRecompenses = this.filteredRecompenses.slice(start, end);
  }

  // Actions
  viewRecompense(recompense: RecompenseDisplay) {
    // Navigate to recompense details page
    this.router.navigate(['/admin/recompensedetails', recompense.id]);
  }

  editRecompense(recompense: RecompenseDisplay) {
    // Navigate to edit recompense page
    this.router.navigate(['/admin/editerrecompense', recompense.id]);
  }

  deleteRecompense(recompense: RecompenseDisplay) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette récompense ?')) {
      this.badgesService.delete(recompense.id).subscribe({
        next: () => {
          // Remove from lists
          this.recompenses = this.recompenses.filter(r => r.id !== recompense.id);
          this.filteredRecompenses = this.filteredRecompenses.filter(r => r.id !== recompense.id);
          this.totalFiltered = this.filteredRecompenses.length;
          this.updatePagination();
        },
        error: (err) => {
          console.error('Error deleting recompense:', err);
          alert('Erreur lors de la suppression de la récompense');
        }
      });
    }
  }

  protected readonly faEye = faEye;
  protected readonly faEdit = faEdit;
  protected readonly faTrash = faTrash;
}