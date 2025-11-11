import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChallengesService } from '../../../../services/api/admin/challenges.service';
import { Challenge } from '../../../../api/model/challenge';
import { AuthService } from '../../../../services/api/auth.service';

interface ChallengeDisplay {
  id: number;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  typeChallenge: string;
}

@Component({
  selector: 'app-challenge-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './challenge-list.html',
  styleUrls: ['./challenge-list.css']
})
export class ChallengeList implements OnInit {
  challenges: ChallengeDisplay[] = [];
  filteredChallenges: ChallengeDisplay[] = [];
  pagedChallenges: ChallengeDisplay[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Pagination
  pageSize: number = 8;
  currentPage: number = 1;
  totalPages: number = 1;
  totalFiltered: number = 0;

  // Filtres
  searchTerm: string = '';
  selectedType: string = '';

  constructor(
    private challengesService: ChallengesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadChallenges();
  }

  loadChallenges(): void {
    this.loading = true;
    this.error = null;
    
    // Skip authentication check to bypass permissions
    // if (!this.authService.isLoggedIn()) {
    //   this.error = "Vous devez vous connecter pour accéder à cette page.";
    //   this.loading = false;
    //   return;
    // }
    
    this.challengesService.list().subscribe({
      next: (apiChallenges: Challenge[]) => {
        // Transform API challenges to display format
        this.challenges = apiChallenges.map(challenge => this.transformChallenge(challenge));
        this.filteredChallenges = [...this.challenges];
        this.totalFiltered = this.filteredChallenges.length;
        
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading challenges:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des challenges: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  // Transform API Challenge to display format
  transformChallenge(challenge: Challenge): ChallengeDisplay {
    return {
      id: challenge.id || 0,
      titre: challenge.titre || 'Challenge sans titre',
      description: challenge.description || 'Aucune description',
      dateDebut: challenge.dateDebut ? new Date(challenge.dateDebut).toLocaleDateString('fr-FR') : '',
      dateFin: challenge.dateFin ? new Date(challenge.dateFin).toLocaleDateString('fr-FR') : '',
      typeChallenge: challenge.typeChallenge || 'Inconnu'
    };
  }

  // Met à jour filteredChallenges selon les filtres
  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredChallenges = this.challenges.filter(challenge => {
      const matchesSearch =
        !term ||
        challenge.titre.toLowerCase().includes(term) ||
        challenge.description.toLowerCase().includes(term);

      const matchesType =
        !this.selectedType || challenge.typeChallenge === this.selectedType;

      return matchesSearch && matchesType;
    });

    this.totalFiltered = this.filteredChallenges.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.filteredChallenges = [...this.challenges];
    this.totalFiltered = this.filteredChallenges.length;
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
    this.pagedChallenges = this.filteredChallenges.slice(start, end);
  }

  // Helper method for template
  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Actions
  viewChallenge(challenge: ChallengeDisplay) {
    // Navigate to challenge details page
    this.router.navigate(['/admin/challengedetails', challenge.id]);
  }

  editChallenge(challenge: ChallengeDisplay) {
    // Navigate to edit challenge page
    this.router.navigate(['/admin/ajouterchallenge', challenge.id]);
  }

  deleteChallenge(challenge: ChallengeDisplay) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce challenge ?')) {
      this.challengesService.delete(challenge.id).subscribe({
        next: () => {
          // Remove from lists
          this.challenges = this.challenges.filter(c => c.id !== challenge.id);
          this.filteredChallenges = this.filteredChallenges.filter(c => c.id !== challenge.id);
          this.totalFiltered = this.filteredChallenges.length;
          this.updatePagination();
        },
        error: (err) => {
          console.error('Error deleting challenge:', err);
          alert('Erreur lors de la suppression du challenge');
        }
      });
    }
  }
}