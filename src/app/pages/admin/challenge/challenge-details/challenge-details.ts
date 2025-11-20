import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChallengesService } from '../../../../services/api/admin/challenges.service';
import { Challenge } from '../../../../api/model/challenge';
import { AuthService } from '../../../../services/api/auth.service';

@Component({
  selector: 'app-challenge-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-details.html',
  styleUrls: ['./challenge-details.css'],
})
export class ChallengeDetails implements OnInit {
  challenge: Challenge | null = null;
  loading: boolean = false;
  error: string | null = null;
  challengeId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private challengesService: ChallengesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }

    // Get challenge ID from route parameters
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.challengeId = +params['id'];
        this.loadChallengeDetails(this.challengeId);
      } else {
        this.error = "ID du challenge non spécifié.";
      }
    });
  }

  loadChallengeDetails(id: number): void {
    this.loading = true;
    this.error = null;

    this.challengesService.get(id).subscribe({
      next: (challenge: Challenge) => {
        this.challenge = challenge;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading challenge details:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource.";
        } else if (err.status === 404) {
          this.error = "Challenge non trouvé.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des détails du challenge: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/challengelist']);
  }

  editChallenge(): void {
    if (this.challengeId) {
      this.router.navigate(['/admin/ajouterchallenge']);
    }
  }
}