import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {CommonModule,Location} from '@angular/common';
import {faArrowLeft, faEye, faFilter, faPenToSquare, faRedoAlt} from '@fortawesome/free-solid-svg-icons';


interface User {
  id: number;
  initials: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  level: string;
  registrationDate: string;
  points: string;
  status: string;
  color: string;
}

@Component({
  selector: 'app-utilisateur-list',
  imports: [
    FormsModule,
    FaIconComponent,
    CommonModule
  ],
  standalone: true,
  templateUrl: './utilisateur-list.html',
  styleUrl: './utilisateur-list.css'
})
export class UtilisateurList implements OnInit{
  constructor(private location: Location) {} //  injection du service Angular
  // Icônes FontAwesome
  faPen = faPenToSquare;

  // Données utilisateurs (simule une future API)
  users: User[] = [];
  filteredUsers: User[] = [];
  pagedUsers: User[] = [];
  totalFiltered: number = 0;

  // Pagination
  pageSize: number = 10;          // items par page (change si besoin)
  currentPage: number = 1;
  totalPages: number = 1;
  pageNumbers: number[] = [];

  // Détermine les indices affichés
  displayedFrom: number = 0;
  displayedTo: number = 0;

  // Filtres
  searchTerm: string = '';
  selectedLevel: string = 'Tous les niveaux';
  selectedStatus: string = 'Tous les statuts';

  ngOnInit(): void {
    // Simule le chargement depuis une API
    this.users = [
      { id: 1, initials: 'HD', firstName: 'Hamidou', lastName: 'DJIRÉ', email: 'hamidou.djire@gmail.com', phone: '+223 74409973', level: '4ème', registrationDate: '2025-10-18', points: '1,20k', status: 'Actif', color: 'blue' },
      { id: 2, initials: 'AB', firstName: 'Awa', lastName: 'B.', email: 'awa@example.com', phone: '+223 70000000', level: '3ème', registrationDate: '2025-08-01', points: '900', status: 'Inactif', color: 'green' },
      { id: 3, initials: 'MK', firstName: 'Moussa', lastName: 'K.', email: 'moussa@example.com', phone: '+223 70123456', level: '4ème', registrationDate: '2025-01-12', points: '2,1k', status: 'Actif', color: 'red' },
      { id: 4, initials: 'SD', firstName: 'Sira', lastName: 'D.', email: 'sira@example.com', phone: '+223 71234567', level: '2ème', registrationDate: '2024-12-10', points: '350', status: 'Actif', color: 'darkblue' },
      { id: 4, initials: 'SD', firstName: 'Sira', lastName: 'D.', email: 'sira@example.com', phone: '+223 71234567', level: '2ème', registrationDate: '2024-12-10', points: '350', status: 'Actif', color: 'darkblue' },
      { id: 4, initials: 'SD', firstName: 'Sira', lastName: 'D.', email: 'sira@example.com', phone: '+223 71234567', level: '2ème', registrationDate: '2024-12-10', points: '350', status: 'Actif', color: 'darkblue' },
      { id: 4, initials: 'SD', firstName: 'Sira', lastName: 'D.', email: 'sira@example.com', phone: '+223 71234567', level: '2ème', registrationDate: '2024-12-10', points: '350', status: 'Actif', color: 'darkblue' },
      // ... ajoute plus d'éléments de test si besoin pour voir la pagination
    ];

    this.filteredUsers = [...this.users];
    this.totalFiltered = this.filteredUsers.length;
    this.updatePagination();
  }

  // Met à jour filteredUsers selon les filtres
  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch =
        !term ||
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      const matchesLevel =
        this.selectedLevel === 'Tous les niveaux' || user.level === this.selectedLevel;

      const matchesStatus =
        this.selectedStatus === 'Tous les statuts' || user.status === this.selectedStatus;

      return matchesSearch && matchesLevel && matchesStatus;
    });

    this.totalFiltered = this.filteredUsers.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedLevel = 'Tous les niveaux';
    this.selectedStatus = 'Tous les statuts';
    this.filteredUsers = [...this.users];
    this.totalFiltered = this.filteredUsers.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Calcul et mise à jour de l'affichage paginé
  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
    this.pageNumbers = this.getPageNumbers();
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
    this.pagedUsers = this.filteredUsers.slice(start, end);

    // calcul affichage range
    this.displayedFrom = this.totalFiltered === 0 ? 0 : start + 1;
    this.displayedTo = Math.min(this.totalFiltered, end);
  }

  // renvoie tableau de numéros de pages (ex : [1,2,3,4])
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  // Actions
  viewUser(user: User) {
    console.log('Voir utilisateur:', user);
  }

  editUser(user: User) {
    console.log('Modifier utilisateur:', user);
  }
  protected readonly faEye = faEye;
  protected readonly faFilter = faFilter;
  protected readonly faRedoAlt = faRedoAlt;
  protected readonly faArrowLeft = faArrowLeft;
}

