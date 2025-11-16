import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExercicesService } from '../../../../services/api/admin/exercices.service';
import { Exercice } from '../../../../api/model/exercice';
import { AuthService } from '../../../../services/api/auth.service';

@Component({
  selector: 'app-exercice-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exercice-details.html',
  styleUrls: ['./exercice-details.css'],
})
export class ExerciceDetails implements OnInit {
  exercice: Exercice | null = null;
  loading: boolean = false;
  error: string | null = null;
  exerciceId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private exercicesService: ExercicesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }

    // Get exercice ID from route parameters
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.exerciceId = +params['id'];
        this.loadExerciceDetails(this.exerciceId);
      } else {
        this.error = "ID de l'exercice non spécifié.";
      }
    });
  }

  loadExerciceDetails(id: number): void {
    this.loading = true;
    this.error = null;

    this.exercicesService.get(id).subscribe({
      next: (exercice: Exercice) => {
        this.exercice = exercice;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading exercice details:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource.";
        } else if (err.status === 404) {
          this.error = "Exercice non trouvé.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des détails de l'exercice: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/exercicelist']);
  }

  editExercice(): void {
    if (this.exerciceId) {
      this.router.navigate(['/admin/ajouterexercice', this.exerciceId]);
    }
  }
}