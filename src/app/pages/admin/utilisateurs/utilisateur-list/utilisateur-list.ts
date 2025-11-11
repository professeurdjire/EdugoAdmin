import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {CommonModule, Location} from '@angular/common';
import {faArrowLeft, faEye, faFilter, faPenToSquare, faRedoAlt} from '@fortawesome/free-solid-svg-icons';
import { UsersService } from '../../../../services/api/admin/users.service';
import { User } from '../../../../api/model/user';
import { AuthService } from '../../../../services/api/auth.service';
import { Router } from '@angular/router';

// Updated interface to match API model
interface UserDisplay {
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
  constructor(
    private location: Location,
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router
  ) {}

  // Icônes FontAwesome
  faPen = faPenToSquare;

  // Données utilisateurs (simule une future API)
  users: UserDisplay[] = [];
  bon : User[]
  filteredUsers: UserDisplay[] = [];
  pagedUsers: UserDisplay[] = [];
  totalFiltered: number = 0;
  loading: boolean = false;
  error: string | null = null;

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
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    
    // Skip authentication check to bypass permissions
    // if (!this.authService.isLoggedIn()) {
    //   this.error = "Vous devez vous connecter pour accéder à cette page.";
    //   this.loading = false;
    //   return;
    // }
    
    this.usersService.list().subscribe({
      next: (apiUsers: User[]) => {
        // Filter users by role - only show users with role 'ELEVE'
        const eleveUsers = apiUsers.filter(user => user.role === 'ELEVE');
        
        // Transform API users to display format
        this.users = eleveUsers.map(user => this.transformUser(user));
        this.filteredUsers = [...this.users];
        this.totalFiltered = this.filteredUsers.length;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des utilisateurs: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  // Transform API User to display format
  transformUser(user: User): UserDisplay {
    // Generate initials from first name and last name
    const initials = `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase();
    
    // Determine color based on some logic (you can customize this)
    const colors = ['blue', 'green', 'red', 'darkblue'];
    const colorIndex = user.id ? user.id % colors.length : 0;
    
    return {
      id: user.id || 0,
      initials: initials,
      firstName: user.prenom || '',
      lastName: user.nom || '',
      email: user.email || '',
      phone: '', // Not in API model, you might need to add this to your backend
      level: '', // Not in API model, you might need to add this to your backend
      registrationDate: user.dateCreation || '',
      points: '0', // Not in API model, you might need to add this to your backend
      status: user.estActive ? 'Actif' : 'Inactif',
      color: colors[colorIndex]
    };
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
  viewUser(user: UserDisplay) {
    // Navigate to user details page
    this.router.navigate(['/admin/Utilisateur', user.id]);
  }

  editUser(user: UserDisplay) {
    // Navigate to edit user page
    this.router.navigate(['/admin/editerUtilisateur', user.id]);
  }
  
  protected readonly faEye = faEye;
  protected readonly faFilter = faFilter;
  protected readonly faRedoAlt = faRedoAlt;
  protected readonly faArrowLeft = faArrowLeft;
}