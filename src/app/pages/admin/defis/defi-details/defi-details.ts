import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DefisService } from '../../../../services/api/admin/defis.service';
import { Defi } from '../../../../api/model/defi';
import { AuthService } from '../../../../services/api/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-defi-details',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  templateUrl: './defi-details.html',
  styleUrls: ['./defi-details.css'],
})
export class DefiDetails implements OnInit {
  faArrowLeft = faArrowLeft;
  defi: Defi | null = null;
  loading: boolean = false;
  error: string | null = null;
  defiId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private defisService: DefisService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }

    // Get defi ID from route parameters
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.defiId = +params['id'];
        this.loadDefiDetails(this.defiId);
      } else {
        this.error = "ID du défi non spécifié.";
      }
    });
  }

  loadDefiDetails(id: number): void {
    this.loading = true;
    this.error = null;

    this.defisService.get(id).subscribe({
      next: (defi: Defi) => {
        this.defi = defi;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading defi details:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource.";
        } else if (err.status === 404) {
          this.error = "Défi non trouvé.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des détails du défi: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/defiList']);
  }

  editDefi(): void {
    if (this.defiId) {
      this.router.navigate(['/admin/ajouterdefi']);
    }
  }
}