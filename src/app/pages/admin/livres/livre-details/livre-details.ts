import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LivresService } from '../../../../services/api/admin/livres.service';
import { Livre } from '../../../../api/model/livre';
import { AuthService } from '../../../../services/api/auth.service';

@Component({
  selector: 'app-livre-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './livre-details.html',
  styleUrls: ['./livre-details.css']
})
export class LivreDetails implements OnInit {
  livre: Livre | null = null;
  loading: boolean = false;
  error: string | null = null;
  livreId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private livresService: LivresService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }

    // Get livre ID from route parameters
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.livreId = +params['id'];
        this.loadLivreDetails(this.livreId);
      } else {
        this.error = "ID du livre non spécifié.";
      }
    });
  }

  loadLivreDetails(id: number): void {
    this.loading = true;
    this.error = null;

    this.livresService.get(id).subscribe(
      (livre: Livre) => {
        this.livre = livre;
        this.loading = false;
      },
      (err) => {
        console.error('Error loading livre details:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource.";
        } else if (err.status === 404) {
          this.error = "Livre non trouvé.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des détails du livre: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    );
  }

  goBack(): void {
    this.router.navigate(['/admin/livreList']);
  }

  editLivre(): void {
    if (this.livreId) {
      this.router.navigate(['/admin/ajouterlivre']);
    }
  }
}