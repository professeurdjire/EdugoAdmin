import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faPen, faTrash, faFilter, faRedoAlt } from '@fortawesome/free-solid-svg-icons';

import { Partenaire } from '../../../../models/partenaire.model';
import { PartenaireService } from '../../../../services/api/partenaire.service';

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
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredPartenaires = this.partenaires.filter(p => {
      const matchSearch =
        !this.searchTerm ||
        p.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.domaine?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchStatus =
        !this.selectedStatus || p.statut?.toLowerCase() === this.selectedStatus.toLowerCase();

      const matchType =
        !this.selectedType || p.type?.toLowerCase() === this.selectedType.toLowerCase();

      return matchSearch && matchStatus && matchType;
    });

    // Appliquer le tri après filtrage
    this.applySort();

    // Recalculer pagination
    this.currentPage = 0;
    this.totalPages = Math.ceil(this.filteredPartenaires.length / this.pageSize);
  }

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
    this.applySort();
  }

  private applySort(): void {
    this.filteredPartenaires.sort((a, b) => {
      let valA = (a as any)[this.sortField];
      let valB = (b as any)[this.sortField];

      if (valA == null) valA = '';
      if (valB == null) valB = '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ----------------------------------
  // Pagination
  // ----------------------------------
  getPages(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  goToPage(page: number): void {
    this.currentPage = page - 1;
  }

  previousPage(): void {
    if (this.currentPage > 0) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) this.currentPage++;
  }

  onPageSizeChange(): void {
    this.totalPages = Math.ceil(this.filteredPartenaires.length / this.pageSize);
    this.currentPage = 0;
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
  // Chargement des partenaires
  // ----------------------------------
  // ----------------------------------
// Chargement des partenaires
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
    next: (response: any) => {
      console.log('Réponse complète:', response);
      
      // Gestion flexible de la réponse SANS utiliser response.data
      if (response && response.content) {
        // Format Spring Page (PartenaireResponse)
        this.partenaires = response.content;
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 1;
      } else if (response && Array.isArray(response)) {
        // Format tableau simple (Partenaire[])
        this.partenaires = response;
        this.totalElements = response.length;
        this.totalPages = Math.ceil(response.length / this.pageSize);
      } else if (response && typeof response === 'object') {
        // Autre format d'objet - essayer d'extraire les données
        this.partenaires = response.content || response.items || response.partenaires || [];
        this.totalElements = response.totalElements || response.total || this.partenaires.length;
        this.totalPages = response.totalPages || Math.ceil(this.totalElements / this.pageSize);
      } else {
        // Format inconnu, utiliser les données directement
        this.partenaires = response || [];
        this.totalElements = this.partenaires.length;
        this.totalPages = Math.ceil(this.totalElements / this.pageSize);
      }

      // Toujours initialiser filteredPartenaires
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
      
      // Charger les données d'exemple seulement en cas d'erreur réelle
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
    const labels: Record<string, string> = { actif: 'Actif', inactif: 'Inactif', en_attente: 'En attente' };
    return labels[statut.toLowerCase()] || statut;
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