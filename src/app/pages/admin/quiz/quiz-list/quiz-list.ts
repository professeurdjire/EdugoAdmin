import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../../../services/api/admin/quiz.service';
import { Quiz } from '../../../../api/model/quiz';
import { AuthService } from '../../../../services/api/auth.service';

interface QuizDisplay {
  id: number;
  statut: string;
  createdAt: string;
  nombreQuestions: number;
  livre: string;
}

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './quiz-list.html',
  styleUrls: ['./quiz-list.css']
})
export class QuizList implements OnInit {
  quizs: QuizDisplay[] = [];
  filteredQuizs: QuizDisplay[] = [];
  pagedQuizs: QuizDisplay[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Pagination
  pageSize: number = 8;
  currentPage: number = 1;
  totalPages: number = 1;
  totalFiltered: number = 0;

  // Filtres
  searchTerm: string = '';
  selectedStatus: string = '';

  constructor(
    private quizService: QuizService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuizs();
  }

  loadQuizs(): void {
    this.loading = true;
    this.error = null;
    
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      this.loading = false;
      return;
    }
    
    this.quizService.list().subscribe({
      next: (apiQuizs: Quiz[]) => {
        // Transform API quizs to display format
        this.quizs = apiQuizs.map(quiz => this.transformQuiz(quiz));
        this.filteredQuizs = [...this.quizs];
        this.totalFiltered = this.filteredQuizs.length;
        
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading quizs:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des quizs: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  // Transform API Quiz to display format
  transformQuiz(quiz: Quiz): QuizDisplay {
    return {
      id: quiz.id || 0,
      statut: quiz.statut || 'Inconnu',
      createdAt: quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('fr-FR') : '',
      nombreQuestions: quiz.nombreQuestions || 0,
      livre: quiz.livre?.titre || 'Non associé'
    };
  }

  // Met à jour filteredQuizs selon les filtres
  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredQuizs = this.quizs.filter(quiz => {
      const matchesSearch =
        !term ||
        quiz.livre.toLowerCase().includes(term) ||
        quiz.statut.toLowerCase().includes(term);

      const matchesStatus =
        !this.selectedStatus || quiz.statut === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });

    this.totalFiltered = this.filteredQuizs.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.filteredQuizs = [...this.quizs];
    this.totalFiltered = this.filteredQuizs.length;
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
    this.pagedQuizs = this.filteredQuizs.slice(start, end);
  }

  // Actions
  viewQuiz(quiz: QuizDisplay) {
    // Navigate to quiz details page
    this.router.navigate(['/admin/quizdetails', quiz.id]);
  }

  editQuiz(quiz: QuizDisplay) {
    // Navigate to edit quiz page
    this.router.navigate(['/admin/ajouterQuiz', quiz.id]);
  }

  deleteQuiz(quiz: QuizDisplay) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      this.quizService.delete(quiz.id).subscribe({
        next: () => {
          // Remove from lists
          this.quizs = this.quizs.filter(q => q.id !== quiz.id);
          this.filteredQuizs = this.filteredQuizs.filter(q => q.id !== quiz.id);
          this.totalFiltered = this.filteredQuizs.length;
          this.updatePagination();
        },
        error: (err) => {
          console.error('Error deleting quiz:', err);
          alert('Erreur lors de la suppression du quiz');
        }
      });
    }
  }
}