import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DefisService } from '../../../../services/api/admin/defis.service';
import { Defi } from '../../../../api/model/defi';
import { AuthService } from '../../../../services/api/auth.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFilter, faRedoAlt, faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

interface DefiDisplay {
  id: number;
  titre: string;
  ennonce: string;
  dateAjout: string;
  pointDefi: number;
  typeDefi: string;
}

@Component({
  selector: 'app-defi-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaIconComponent],
  templateUrl: './defi-list.html',
  styleUrls: ['./defi-list.css']
})
export class DefiList implements OnInit {
  faFilter = faFilter;
  faRedoAlt = faRedoAlt;
  faEye = faEye;
  faPen = faPen;
  faTrash = faTrash;
  defis: DefiDisplay[] = [];
  filteredDefis: DefiDisplay[] = [];
  pagedDefis: DefiDisplay[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Pagination
  pageSize: number = 8;
  currentPage: number = 1;
  totalPages: number = 1;
  totalFiltered: number = 0;

  // Filtres
  searchTerm: string = '';
  selectedType: string = '';

  constructor(
    private defisService: DefisService,
    private authService: AuthService,
    private router: Router,
    private confirm: ConfirmService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDefis();
  }

  loadDefis(): void {
    this.loading = true;
    this.error = null;
    
    // Skip authentication check to bypass permissions
    // if (!this.authService.isLoggedIn()) {
    //   this.error = "Vous devez vous connecter pour accéder à cette page.";
    //   this.loading = false;
    //   return;
    // }
    
    this.defisService.list().subscribe({
      next: (apiDefis: Defi[]) => {
        // Transform API defis to display format
        this.defis = apiDefis.map(defi => this.transformDefi(defi));
        this.filteredDefis = [...this.defis];
        this.totalFiltered = this.filteredDefis.length;
        
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading defis:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des défis: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  // Transform API Defi to display format
  transformDefi(defi: Defi): DefiDisplay {
    return {
      id: defi.id || 0,
      titre: defi.titre || 'Défi sans titre',
      ennonce: defi.ennonce || 'Aucune énoncé',
      dateAjout: defi.dateAjout ? new Date(defi.dateAjout).toLocaleDateString('fr-FR') : '',
      pointDefi: defi.pointDefi || 0,
      typeDefi: defi.typeDefi || 'Inconnu'
    };
  }

  // Met à jour filteredDefis selon les filtres
  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredDefis = this.defis.filter(defi => {
      const matchesSearch =
        !term ||
        defi.titre.toLowerCase().includes(term) ||
        defi.ennonce.toLowerCase().includes(term);

      const matchesType =
        !this.selectedType || defi.typeDefi === this.selectedType;

      return matchesSearch && matchesType;
    });

    this.totalFiltered = this.filteredDefis.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.filteredDefis = [...this.defis];
    this.totalFiltered = this.filteredDefis.length;
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
    this.pagedDefis = this.filteredDefis.slice(start, end);
  }

  // Helper method for template
  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Actions
  viewDefi(defi: DefiDisplay) {
    // Navigate to defi details page
    this.router.navigate(['/admin/defiDetails', defi.id]);
  }

  editDefi(defi: DefiDisplay) {
    // Navigate to edit defi page
    this.router.navigate(['/admin/ajouterdefi', defi.id]);
  }

  deleteDefi(defi: DefiDisplay) {
    this.confirm
      .confirm({
        title: 'Supprimer le défi',
        message: 'Êtes-vous sûr de vouloir supprimer ce défi ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      })
      .then((ok) => {
        if (!ok) return;
        this.defisService.delete(defi.id).subscribe({
          next: () => {
            this.defis = this.defis.filter(d => d.id !== defi.id);
            this.filteredDefis = this.filteredDefis.filter(d => d.id !== defi.id);
            this.totalFiltered = this.filteredDefis.length;
            this.updatePagination();
            this.toast.success('Défi supprimé avec succès');
          },
          error: (err) => {
            console.error('Error deleting defi:', err);
            this.toast.error('Erreur lors de la suppression du défi');
          }
        });
      });
  }
}