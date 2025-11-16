import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faPen, faTrash, faFilter, faRedoAlt } from '@fortawesome/free-solid-svg-icons';

import { Partenaire } from '../../../../models/partenaire.model';
import { PartenaireService, PartenaireResponse } from '../../../../services/api/partenaire.service';

@Component({
  selector: 'app-partenaire-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaIconComponent],
  templateUrl: './partenaire-list.html',
  styleUrls: ['./partenaire-list.css']
})
export class PartenaireList implements OnInit {
  faEye = faEye;
  faPen = faPen;
  faTrash = faTrash;
  faFilter = faFilter;
  faRedoAlt = faRedoAlt;
  partenaires: Partenaire[] = [];
  filteredPartenaires: Partenaire[] = [];
  selectedIds: number[] = [];

  // Filtres
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedType: string = '';

  // Tri
  sortField: string = 'nom';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 1;
  totalElements: number = 0;

  // Modal
  showDeleteModal: boolean = false;
  partenaireToDelete: Partenaire | null = null;

  // Loading
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private partenaireService: PartenaireService
  ) {}

  ngOnInit(): void {
    this.loadPartenaires();
  }

  // ----------------------------------
  // Filtrage
  // ----------------------------------
  onSearch(): void {
    this.currentPage = 0;
    this.loadPartenaires();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadPartenaires();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.currentPage = 0;
    this.loadPartenaires();
  }
  // Le filtrage est géré côté backend via les paramètres de getAll.

  // ----------------------------------
  // Tri
  // ----------------------------------
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0;
    this.loadPartenaires();
  }
  // Le tri est géré par le backend via sortField / sortDirection.

  // ----------------------------------
  // Pagination
  // ----------------------------------
  getPages(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  goToPage(page: number): void {
    this.currentPage = page - 1;
    this.loadPartenaires();
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPartenaires();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPartenaires();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadPartenaires();
  }

  getDisplayRange(): string {
    if (!this.filteredPartenaires.length) return '0-0';
    const start = this.currentPage * this.pageSize + 1;
    let end = start + this.pageSize - 1;
    if (end > this.filteredPartenaires.length) end = this.filteredPartenaires.length;
    return `${start}-${end}`;
  }

  // ----------------------------------
  // Sélection multiple
  // ----------------------------------
  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  toggleSelection(id: number): void {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter(x => x !== id);
    } else {
      this.selectedIds.push(id);
    }
  }

  isAllSelected(): boolean {
    if (!this.filteredPartenaires.length) return false;
    return this.filteredPartenaires.every(p => this.selectedIds.includes(p.id));
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedIds = this.filteredPartenaires.map(p => p.id);
    } else {
      this.selectedIds = [];
    }
  }

  // ----------------------------------
  // Chargement des partenaires (backend paginé)
  // ----------------------------------
  loadPartenaires(): void {
    this.isLoading = true;
    this.error = null;

    console.log('Chargement partenaires avec params:', {
      page: this.currentPage,
      size: this.pageSize,
      sort: this.sortField,
      direction: this.sortDirection,
      search: this.searchTerm,
      status: this.selectedStatus,
      type: this.selectedType
    });

    this.partenaireService.getAll(
      this.currentPage,
      this.pageSize,
      this.sortField,
      this.sortDirection,
      this.searchTerm,
      this.selectedStatus,
      this.selectedType
    ).subscribe({
      next: (response: PartenaireResponse) => {
        console.log('Réponse complète:', response);

        this.partenaires = response?.content || [];
        this.totalElements = response?.totalElements || this.partenaires.length;
        this.totalPages = response?.totalPages || 1;

        // Les lignes affichées correspondent à la page courante renvoyée par le backend
        this.filteredPartenaires = [...this.partenaires];

        console.log('Données finales:', {
          partenaires: this.partenaires.length,
          totalElements: this.totalElements,
          totalPages: this.totalPages,
          filtered: this.filteredPartenaires.length
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des partenaires:', err);
        this.error = 'Erreur lors du chargement des partenaires: ' + err.message;
        this.isLoading = false;

        // Charger les données d'exemple seulement en cas d'erreur réelle réseau/serveur
        if (err.status === 0 || err.status >= 500) {
          this.loadSampleData();
        }
      }
    });
  }

  loadSampleData(): void {
    this.partenaires = [
      { id: 1, nom: 'Université de Bamako', domaine: 'Éducation', type: 'institution', email: 'contact@univ-bamako.ml', telephone: '+22320212223', dateAjout: '2024-01-15', statut: 'actif', pays: 'Mali', newsletter: true },
      { id: 2, nom: 'Orange Mali', domaine: 'Télécom', type: 'entreprise', email: 'partenariat@orange.ml', telephone: '+22320242526', dateAjout: '2024-02-10', statut: 'actif', pays: 'Mali', newsletter: true },
      { id: 3, nom: 'UNICEF Mali', domaine: 'Humanitaire', type: 'ong', email: 'mali@unicef.org', dateAjout: '2024-03-05', statut: 'en_attente', pays: 'Mali', newsletter: true }
    ];
    this.filteredPartenaires = this.partenaires;
    this.totalElements = this.partenaires.length;
    this.totalPages = 1;
  }

  // ----------------------------------
  // Getters statistiques
  // ----------------------------------
  get totalPartenaires(): number {
    return this.totalElements;
  }

  get activePartenaires(): number {
    return (this.partenaires ?? []).filter(p => p?.statut === 'actif').length;
  }

  get pendingPartenaires(): number {
    return (this.partenaires ?? []).filter(p => p?.statut === 'en_attente').length;
  }

  get newThisMonth(): number {
    const list = this.partenaires ?? [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return list.filter(p => {
      if (!p?.dateAjout) return false;
      const date = new Date(p.dateAjout);
      return !isNaN(date.getTime()) && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }

  getInitials(nom: string): string {
    if (!nom) return '';
    return nom
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  getTypeLabel(type: string): string {
    if (!type) return 'Non défini';
    const labels: Record<string, string> = { institution: 'Institution', entreprise: 'Entreprise', ong: 'ONG', gouvernement: 'Gouvernement' };
    return labels[type.toLowerCase()] || type;
  }

  getStatusLabel(statut: string): string {
    if (!statut) return 'Non défini';
    const key = statut.toLowerCase();
    const labels: Record<string, string> = {
      actif: 'Actif',
      inactif: 'Inactif',
      en_attente: 'En attente',
      pending: 'En attente'
    };
    return labels[key] || statut;
  }

  // Helper pour déduire un statut à partir du boolean "actif" si le backend ne fournit pas encore "statut"
  getComputedStatus(p: Partenaire): string {
    if (p.statut) {
      return this.getStatusLabel(p.statut);
    }
    if ((p as any).actif === true) {
      return 'Actif';
    }
    if ((p as any).actif === false) {
      return 'Inactif';
    }
    return 'Non défini';
  }

  // ----------------------------------
  // Actions CRUD
  // ----------------------------------
  openAddModal(): void { this.router.navigate(['/admin/ajouterpartenaire']); }
  viewPartenaire(id: number): void { this.router.navigate(['/admin/ajouterpartenaire', id]); }
  editPartenaire(id: number): void { this.router.navigate(['/admin/ajouterpartenaire', id]); }
  deletePartenaire(p: Partenaire): void { this.partenaireToDelete = p; this.showDeleteModal = true; }
  closeDeleteModal(): void { this.showDeleteModal = false; this.partenaireToDelete = null; }
  confirmDelete(): void {
    if (!this.partenaireToDelete?.id) return;
    this.partenaireService.delete(this.partenaireToDelete.id).subscribe({
      next: () => { this.loadPartenaires(); this.closeDeleteModal(); this.selectedIds = this.selectedIds.filter(id => id !== this.partenaireToDelete!.id); },
      error: (err) => { console.error('Erreur suppression:', err); this.error = 'Erreur lors de la suppression'; }
    });
  }

  exportToExcel(): void {
    const filters = { search: this.searchTerm, status: this.selectedStatus, type: this.selectedType };
    this.partenaireService.exportToExcel(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `partenaires_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => { console.error('Erreur export:', err); this.error = 'Erreur export Excel'; }
    });
  }

  refreshData(): void { this.loadPartenaires(); this.selectedIds = []; }

  debugInfo(): string { return `Partenaires: ${this.partenaires.length} | Page: ${this.currentPage+1}/${this.totalPages}`; }
}