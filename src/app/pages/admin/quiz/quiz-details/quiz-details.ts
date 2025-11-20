import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../../../services/api/admin/quiz.service';
import { Quiz } from '../../../../api/model/quiz';
import { AuthService } from '../../../../services/api/auth.service';

@Component({
  selector: 'app-quiz-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-details.html',
  styleUrls: ['./quiz-details.css'],
})
export class QuizDetails implements OnInit {
  quiz: Quiz | null = null;
  loading: boolean = false;
  error: string | null = null;
  quizId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }

    // Get quiz ID from route parameters
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.quizId = +params['id'];
        this.loadQuizDetails(this.quizId);
      } else {
        this.error = "ID du quiz non spécifié.";
      }
    });
  }

  loadQuizDetails(id: number): void {
    this.loading = true;
    this.error = null;

    this.quizService.get(id).subscribe({
      next: (quiz: Quiz) => {
        this.quiz = quiz;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading quiz details:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource.";
        } else if (err.status === 404) {
          this.error = "Quiz non trouvé.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des détails du quiz: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/quizlist']);
  }

  editQuiz(): void {
    if (this.quizId) {
      this.router.navigate(['/admin/ajouterQuiz']);
    }
  }
}