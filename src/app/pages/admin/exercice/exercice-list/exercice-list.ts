import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExercicesService } from '../../../../services/api/admin/exercices.service';
import { Exercice } from '../../../../api/model/exercice';
import { AuthService } from '../../../../services/api/auth.service';

interface ExerciceDisplay {
  id: number;
  titre: string;
  description: string;
  dateCreation: string;
  niveauDifficulte: number;
  matiere: string;
}

@Component({
  selector: 'app-exercice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './exercice-list.html',
  styleUrls: ['./exercice-list.css']
})
export class ExerciceList implements OnInit {
  exercices: ExerciceDisplay[] = [];
  filteredExercices: ExerciceDisplay[] = [];
  pagedExercices: ExerciceDisplay[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Pagination
  pageSize: number = 8;
  currentPage: number = 1;
  totalPages: number = 1;
  totalFiltered: number = 0;

  // Filtres
  searchTerm: string = '';
  selectedDifficulty: string = '';

  constructor(
    private exercicesService: ExercicesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExercices();
  }

  loadExercices(): void {
    this.loading = true;
    this.error = null;
    
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      this.loading = false;
      return;
    }
    
    this.exercicesService.list().subscribe({
      next: (apiExercices: Exercice[]) => {
        // Transform API exercices to display format
        this.exercices = apiExercices.map(exercice => this.transformExercice(exercice));
        this.filteredExercices = [...this.exercices];
        this.totalFiltered = this.filteredExercices.length;
        
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading exercices:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des exercices: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  // Transform API Exercice to display format
  transformExercice(exercice: Exercice): ExerciceDisplay {
    return {
      id: exercice.id || 0,
      titre: exercice.titre || 'Exercice sans titre',
      description: exercice.description || 'Aucune description',
      dateCreation: exercice.dateCreation ? new Date(exercice.dateCreation).toLocaleDateString('fr-FR') : '',
      niveauDifficulte: exercice.niveauDifficulte || 0,
      matiere: exercice.matiere?.nom || 'Non spécifiée'
    };
  }

  // Met à jour filteredExercices selon les filtres
  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredExercices = this.exercices.filter(exercice => {
      const matchesSearch =
        !term ||
        exercice.titre.toLowerCase().includes(term) ||
        exercice.description.toLowerCase().includes(term);

      const matchesDifficulty =
        !this.selectedDifficulty || exercice.niveauDifficulte?.toString() === this.selectedDifficulty;

      return matchesSearch && matchesDifficulty;
    });

    this.totalFiltered = this.filteredExercices.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedDifficulty = '';
    this.filteredExercices = [...this.exercices];
    this.totalFiltered = this.filteredExercices.length;
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
    this.pagedExercices = this.filteredExercices.slice(start, end);
  }

  // Actions
  viewExercice(exercice: ExerciceDisplay) {
    // Navigate to exercice details page
    this.router.navigate(['/admin/exercicedetails', exercice.id]);
  }

  editExercice(exercice: ExerciceDisplay) {
    // Navigate to edit exercice page
    this.router.navigate(['/admin/ajouterexercice', exercice.id]);
  }

  deleteExercice(exercice: ExerciceDisplay) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      this.exercicesService.delete(exercice.id).subscribe({
        next: () => {
          // Remove from lists
          this.exercices = this.exercices.filter(e => e.id !== exercice.id);
          this.filteredExercices = this.filteredExercices.filter(e => e.id !== exercice.id);
          this.totalFiltered = this.filteredExercices.length;
          this.updatePagination();
        },
        error: (err) => {
          console.error('Error deleting exercice:', err);
          alert('Erreur lors de la suppression de l\'exercice');
        }
      });
    }
  }
}