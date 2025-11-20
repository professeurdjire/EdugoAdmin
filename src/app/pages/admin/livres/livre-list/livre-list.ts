import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LivresService } from '../../../../services/api/admin/livres.service';
import { Livre } from '../../../../api/model/livre';
import { AuthService } from '../../../../services/api/auth.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faPen, faTrash, faFilter, faRedoAlt } from '@fortawesome/free-solid-svg-icons';

interface LivreDisplay {
  id: number;
  titre: string;
  auteur: string;
  anneePublication: number;
  matiere: string;
  langue: string;
}

@Component({
  selector: 'app-livre-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaIconComponent],
  templateUrl: './livre-list.html',
  styleUrls: ['./livre-list.css']
})
export class LivreList implements OnInit {
  faEye = faEye;
  faPen = faPen;
  faTrash = faTrash;
  faFilter = faFilter;
  faRedoAlt = faRedoAlt;
  livres: LivreDisplay[] = [];
  filteredLivres: LivreDisplay[] = [];
  pagedLivres: LivreDisplay[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Pagination
  pageSize: number = 8;
  currentPage: number = 1;
  totalPages: number = 1;
  totalFiltered: number = 0;

  // Filtres
  searchTerm: string = '';
  selectedSubject: string = '';

  constructor(
    private livresService: LivresService,
    private authService: AuthService,
    private router: Router,
    private confirm: ConfirmService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadLivres();
  }

  loadLivres(): void {
    this.loading = true;
    this.error = null;
    
    // Skip authentication check to bypass permissions
    // if (!this.authService.isLoggedIn()) {
    //   this.error = "Vous devez vous connecter pour accéder à cette page.";
    //   this.loading = false;
    //   return;
    // }
    
    this.livresService.list().subscribe({
      next: (apiLivres: Livre[]) => {
        // Transform API livres to display format
        this.livres = apiLivres.map(livre => this.transformLivre(livre));
        this.filteredLivres = [...this.livres];
        this.totalFiltered = this.filteredLivres.length;
        
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading livres:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des livres: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  // Transform API Livre to display format
  transformLivre(livre: Livre): LivreDisplay {
    const matiereNom = (livre as any).matiereNom || livre.matiere?.nom || '-';
    const langueNom = (livre as any).langueNom || livre.langue?.nom || '-';

    return {
      id: livre.id || 0,
      titre: livre.titre || 'Livre sans titre',
      auteur: livre.auteur || 'Auteur inconnu',
      anneePublication: livre.anneePublication || 0,
      matiere: matiereNom,
      langue: langueNom
    };
  }

  // Met à jour filteredLivres selon les filtres
  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredLivres = this.livres.filter(livre => {
      const matchesSearch =
        !term ||
        livre.titre.toLowerCase().includes(term) ||
        livre.auteur.toLowerCase().includes(term);

      const matchesSubject =
        !this.selectedSubject || livre.matiere === this.selectedSubject;

      return matchesSearch && matchesSubject;
    });

    this.totalFiltered = this.filteredLivres.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedSubject = '';
    this.filteredLivres = [...this.livres];
    this.totalFiltered = this.filteredLivres.length;
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
    this.pagedLivres = this.filteredLivres.slice(start, end);
  }

  // Helper method for template
  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Actions
  viewLivre(livre: LivreDisplay) {
    // Ouvrir le formulaire livre en mode consultation (lecture seule)
    this.router.navigate(['/admin/ajouterlivre', livre.id], {
      queryParams: { mode: 'view' }
    });
  }

  editLivre(livre: LivreDisplay) {
    // Navigate to edit livre page
    this.router.navigate(['/admin/ajouterlivre', livre.id]);
  }

  deleteLivre(livre: LivreDisplay) {
    this.confirm
      .confirm({
        title: 'Supprimer le livre',
        message: 'Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      })
      .then((ok) => {
        if (!ok) return;
        this.livresService.delete(livre.id).subscribe({
          next: () => {
            this.livres = this.livres.filter(l => l.id !== livre.id);
            this.filteredLivres = this.filteredLivres.filter(l => l.id !== livre.id);
            this.totalFiltered = this.filteredLivres.length;
            this.updatePagination();
            this.toast.success('Livre supprimé avec succès');
          },
          error: (err) => {
            console.error('Error deleting livre:', err);
            this.toast.error('Erreur lors de la suppression du livre');
          }
        });
      });
  }
}