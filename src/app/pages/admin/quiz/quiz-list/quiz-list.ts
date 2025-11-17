import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faPen, faTrash, faFilter, faRedoAlt } from '@fortawesome/free-solid-svg-icons';
import { QuizService } from '../../../../services/api/admin/quiz.service';
import { Quiz } from '../../../../api/model/quiz';
import { AuthService } from '../../../../services/api/auth.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface QuizDisplay {
  id: number;
  statut: string;
  createdAt: string;
  nombreQuestions: number;
  livre: string;
  titre: string;
}

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaIconComponent],
  templateUrl: './quiz-list.html',
  styleUrls: ['./quiz-list.css']
})
export class QuizList implements OnInit {
  faEye = faEye;
  faPen = faPen;
  faTrash = faTrash;
  faFilter = faFilter;
  faRedoAlt = faRedoAlt;
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
    private router: Router,
    private confirm: ConfirmService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadQuizs();
  }

  loadQuizs(): void {
    this.loading = true;
    this.error = null;
    
    // Skip authentication check to bypass permissions
    
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
    const now = new Date();
    const created = quiz.createdAt ? new Date(quiz.createdAt) : null;
    const createdDateStr = (created ?? now).toLocaleDateString('fr-FR');

    const isToday = created
      ? created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      : true; // if missing, consider as new

    const statutDisplay = isToday ? 'NOUVEAU' : (quiz.statut || 'Inconnu');

    return {
      id: quiz.id || 0,
      statut: statutDisplay,
      createdAt: createdDateStr,
      nombreQuestions: quiz.nombreQuestions || 0,
      livre: quiz.livre?.titre || 'Non associé',
      titre: (quiz as any).titre || 'Sans titre'
    };
  }

  // Met à jour filteredQuizs selon les filtres
  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredQuizs = this.quizs.filter(quiz => {
      const matchesSearch =
        !term ||
        quiz.titre.toLowerCase().includes(term) ||
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

  // Helper method for template
  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
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
    this.confirm
      .confirm({
        title: 'Supprimer le quiz',
        message: 'Êtes-vous sûr de vouloir supprimer ce quiz ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      })
      .then((ok) => {
        if (!ok) return;
        this.quizService.delete(quiz.id).subscribe({
          next: () => {
            this.quizs = this.quizs.filter(q => q.id !== quiz.id);
            this.filteredQuizs = this.filteredQuizs.filter(q => q.id !== quiz.id);
            this.totalFiltered = this.filteredQuizs.length;
            this.updatePagination();
            this.toast.success('Quiz supprimé avec succès');
          },
          error: (err) => {
            console.error('Error deleting quiz:', err);
            this.toast.error('Erreur lors de la suppression du quiz');
          }
        });
      });
  }
}