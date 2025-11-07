import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Partenaire {
  id: number;
  nom: string;
  domaine: string;
  type: string;
  email: string;
  telephone?: string;
  dateAjout: Date;
  statut: string;
}

@Component({
  selector: 'app-partenaire-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partenaire-list.html',
  styleUrls: ['./partenaire-list.css']
})
export class PartenaireList implements OnInit {
  // Données
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
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  
  // Modal
  showDeleteModal: boolean = false;
  partenaireToDelete: Partenaire | null = null;
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadSampleData();
    this.applyFilters();
  }

  /**
   * Charge des données d'exemple
   */
  loadSampleData(): void {
    this.partenaires = [
      {
        id: 1,
        nom: 'Université de Bamako',
        domaine: 'Éducation supérieure',
        type: 'institution',
        email: 'contact@univ-bamako.ml',
        telephone: '+223 20 21 22 23',
        dateAjout: new Date('2024-01-15'),
        statut: 'actif'
      },
      {
        id: 2,
        nom: 'Orange Mali',
        domaine: 'Télécommunications',
        type: 'entreprise',
        email: 'partenariat@orange.ml',
        telephone: '+223 20 24 25 26',
        dateAjout: new Date('2024-02-10'),
        statut: 'actif'
      },
      {
        id: 3,
        nom: 'UNICEF Mali',
        domaine: 'Aide humanitaire',
        type: 'ong',
        email: 'mali@unicef.org',
        dateAjout: new Date('2024-03-05'),
        statut: 'en_attente'
      },
      {
        id: 4,
        nom: 'Ministère de l\'Éducation',
        domaine: 'Éducation nationale',
        type: 'gouvernement',
        email: 'contact@education.gov.ml',
        dateAjout: new Date('2024-01-20'),
        statut: 'actif'
      },
      {
        id: 5,
        nom: 'Mali Telecom',
        domaine: 'Technologie',
        type: 'entreprise',
        email: 'info@malitelecom.ml',
        telephone: '+223 20 27 28 29',
        dateAjout: new Date('2024-02-28'),
        statut: 'inactif'
      }
    ];
  }

  /**
   * Applique les filtres et la recherche
   */
  applyFilters(): void {
    let filtered = this.partenaires;

    // Filtre par recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(term) ||
        p.domaine.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter(p => p.statut === this.selectedStatus);
    }

    // Filtre par type
    if (this.selectedType) {
      filtered = filtered.filter(p => p.type === this.selectedType);
    }

    // Tri
    filtered.sort((a, b) => {
      const aValue = a[this.sortField as keyof Partenaire];
      const bValue = b[this.sortField as keyof Partenaire];
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredPartenaires = filtered;
    this.updatePagination();
  }

  /**
   * Gestion de la recherche
   */
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Gestion du changement de filtre
   */
  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Tri des colonnes
   */
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

    // Gestion de la sélection
  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedIds = this.getCurrentPagePartenaires().map(p => p.id);
    } else {
      this.selectedIds = [];
    }
  }

  toggleSelection(id: number): void {
    const index = this.selectedIds.indexOf(id);
    if (index > -1) {
      this.selectedIds.splice(index, 1);
    } else {
      this.selectedIds.push(id);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  isAllSelected(): boolean {
    const currentPageIds = this.getCurrentPagePartenaires().map(p => p.id);
    return currentPageIds.length > 0 && currentPageIds.every(id => this.selectedIds.includes(id));
  }

  // Pagination
  getCurrentPagePartenaires(): Partenaire[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPartenaires.slice(startIndex, startIndex + this.pageSize);
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPartenaires.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (current >= total - 2) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      }
    }
    
    return pages;
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredPartenaires.length);
    return `${start}-${end}`;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  // Statistiques
  get totalPartenaires(): number {
    return this.partenaires.length;
  }

  get activePartenaires(): number {
    return this.partenaires.filter(p => p.statut === 'actif').length;
  }

  get pendingPartenaires(): number {
    return this.partenaires.filter(p => p.statut === 'en_attente').length;
  }

  get newThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.partenaires.filter(p => {
      const date = new Date(p.dateAjout);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }

  // Utilitaires d'affichage
  getInitials(nom: string): string {
    return nom
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'institution': 'Institution',
      'entreprise': 'Entreprise',
      'ong': 'ONG',
      'gouvernement': 'Gouvernement'
    };
    return labels[type] || type;
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'actif': 'Actif',
      'inactif': 'Inactif',
      'en_attente': 'En attente'
    };
    return labels[statut] || statut;
  }

  // Actions
  openAddModal(): void {
    // Navigation vers la page d'ajout ou ouverture d'un modal
    this.router.navigate(['/partenaires/nouveau']);
  }

  viewPartenaire(id: number): void {
    this.router.navigate(['/partenaires', id]);
  }

  editPartenaire(id: number): void {
    this.router.navigate(['/partenaires', id, 'editer']);
  }

  deletePartenaire(partenaire: Partenaire): void {
    this.partenaireToDelete = partenaire;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.partenaireToDelete = null;
  }

  confirmDelete(): void {
    if (this.partenaireToDelete) {
      // Simulation de suppression - à remplacer par un appel API
      this.partenaires = this.partenaires.filter(p => p.id !== this.partenaireToDelete!.id);
      this.applyFilters();
      this.closeDeleteModal();
      
      // Réinitialiser la sélection
      this.selectedIds = this.selectedIds.filter(id => id !== this.partenaireToDelete!.id);
    }
  }

  exportToExcel(): void {
    // Implémentation de l'export Excel
    console.log('Export des partenaires vers Excel:', this.filteredPartenaires);
    // Ici vous pourriez utiliser une bibliothèque comme xlsx
  }

  refreshData(): void {
    this.loadSampleData();
    this.applyFilters();
    this.selectedIds = [];
  }

  // Méthode utilitaire pour le débogage
  get debugInfo(): string {
    return `Partenaires: ${this.partenaires.length} | Filtres: ${this.filteredPartenaires.length} | Page: ${this.currentPage}/${this.totalPages}`;
  }
}