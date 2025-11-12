import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BadgesService } from '../../../../services/api/admin/badges.service';
import { BadgeResponse } from '../../../../api/model/badgeResponse';
import { AuthService } from '../../../../services/api/auth.service';

@Component({
  selector: 'app-recompense-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recompense-details.html',
  styleUrls: ['./recompense-details.css']
})
export class RecompenseDetails implements OnInit {
  badge: BadgeResponse | null = null;
  loading: boolean = false;
  error: string | null = null;
  badgeId: number | null = null;
  badges: BadgeResponse[] = [];

  // Basic statistics (placeholder logic based on badges list)
  totalBadges = 0;
  totalParticipantsActifs = 0;
  totalExercisesCompletes = 0;
  totalPointsGagnes = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private badgesService: BadgesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }

    // Get badge ID from route parameters
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.badgeId = +params['id'];
        this.loadBadgeDetails(this.badgeId);
      } else {
        this.error = "ID du badge non spécifié.";
      }
    });

    // Load all badges for list/statistics
    this.loadAllBadges();
  }

  loadAllBadges(): void {
    this.badges = [];
    this.badgesService.list().subscribe({
      next: (list) => {
        this.badges = list || [];
        // Update basic stats
        this.totalBadges = this.badges.length;
        // Placeholder computations; replace with real metrics when API available
        this.totalParticipantsActifs = this.totalBadges * 47;
        this.totalExercisesCompletes = this.totalBadges * 1000;
        this.totalPointsGagnes = this.totalBadges * 500;
      },
      error: (err) => {
        console.error('Error loading badges:', err);
      }
    });
  }

  loadBadgeDetails(id: number): void {
    this.loading = true;
    this.error = null;

    this.badgesService.get(id).subscribe({
      next: (badge: BadgeResponse) => {
        this.badge = badge;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading badge details:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource.";
        } else if (err.status === 404) {
          this.error = "Badge non trouvé.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des détails du badge: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/recompenseList']);
  }

  editBadge(): void {
    if (this.badgeId) {
      this.router.navigate(['/admin/editerrecompense', this.badgeId]);
    }
  }
}
